import axios from "axios";

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434/api";
const EMBEDDING_MODEL = "qwen3-embedding:0.6b";
const GENERATION_MODEL = "qwen-local";

// وظيفة جلب الـ Embeddings (للبحث)
export const getEmbedding = async (text) => {
  try {
    const response = await axios.post(`${OLLAMA_URL}/embeddings`, {
      model: EMBEDDING_MODEL,
      prompt: text,
    });
    return response.data.embedding;
  } catch (error) {
    console.error("Embedding error:", error);
    return null;
  }
};

// وظيفة التوليد (كودك الأصلي)
export const generateResponse = async (prompt, oldText) => {
  const fackResbonse = false;
  
  if (fackResbonse) { 
    return "this is the model responce";
  }

  const userContent = `المهمة: ${prompt}\n\nالنص الحالي:\n${oldText}`;
  try {
    const response = await axios.post(`${OLLAMA_URL}/generate`, {
      model: GENERATION_MODEL,
      prompt: userContent,
      stream: false,
    });

    return response.data.response || "لم يتم الحصول على رد من النموذج.";
  } catch (error) {
    console.error("Generation error:", error);
    return "تعذر الاتصال بخدمة الذكاء الاصطناعي حالياً. تم الاحتفاظ بالنص الحالي بدون تعديل.";
  }
};

// Streams Ollama's NDJSON response so the amendment UI can display text while
// CAT is still generating it. The completed text remains the source of truth.
export const generateResponseStream = async (prompt, oldText, onChunk) => {
  const userContent = `المهمة: ${prompt}\n\nالنص الحالي:\n${oldText}`;
  const response = await fetch(`${OLLAMA_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: GENERATION_MODEL, prompt: userContent, stream: true }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`CAT generation failed (${response.status})`);
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
      const event = JSON.parse(line);
      if (event.response) {
        // Ollama normally emits deltas, but accept cumulative providers too.
        complete = event.response.startsWith(complete) ? event.response : complete + event.response;
        onChunk?.(complete, event.response);
      }
    }
    if (done) break;
  }

  if (pending.trim()) {
    const event = JSON.parse(pending);
    if (event.response) {
      complete = event.response.startsWith(complete) ? event.response : complete + event.response;
      onChunk?.(complete, event.response);
    }
  }
  return complete || "لم يتم الحصول على رد من النموذج.";
};
