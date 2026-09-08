import axios from "axios";

const BACKEND_API = import.meta.env.VITE_API_URL || "";

/**
 * Generate text via backend.
 * Backend internally calls vLLM and returns the complete generated text.
 *
 * @param {string} prompt - The full prompt (includes task + context)
 * @returns {Promise<string>} - The generated text
 */
export const generateText = async (prompt) => {
  try {
    const endpoint = (BACKEND_API || "") + "/generate";
    const response = await axios.post(endpoint, { prompt });
    return response.data.response || "لم يتم الحصول على رد من النموذج.";
  } catch (error) {
    console.error("Generation error:", error);
    return "تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. تم الاحتفاظ بالنص الحالي بدون تعديل.";
  }
};

/**
 * Generate text with streaming via backend.
 * Backend streams NDJSON format: each line is {"response": "text chunk"}
 * Caller receives growing text chunks in realtime via onChunk callback.
 *
 * @param {string} prompt - The full prompt
 * @param {function} onChunk - Callback(completedText, deltaText) called on each chunk
 * @returns {Promise<string>} - The final complete generated text
 */
export const generateTextStream = async (prompt, onChunk) => {
  try {
    const endpoint = (BACKEND_API || "") + "/generate/stream";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Generation failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = "";
    let complete = "";

    while (true) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = pending.split("\n");
      pending = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);
          if (event.response) {
            // Accumulate response (handle both delta and cumulative responses)
            complete = event.response.startsWith(complete) 
              ? event.response 
              : complete + event.response;
            onChunk?.(complete, event.response);
          }
        } catch (parseErr) {
          console.warn("Failed to parse stream line:", line);
        }
      }
      if (done) break;
    }

    if (pending.trim()) {
      try {
        const event = JSON.parse(pending);
        if (event.response) {
          complete = event.response.startsWith(complete) 
            ? event.response 
            : complete + event.response;
          onChunk?.(complete, event.response);
        }
      } catch (parseErr) {
        console.warn("Failed to parse final stream line");
      }
    }

    return complete || "لم يتم الحصول على رد من النموذج.";
  } catch (error) {
    console.error("Stream generation error:", error);
    throw error;
  }
};
