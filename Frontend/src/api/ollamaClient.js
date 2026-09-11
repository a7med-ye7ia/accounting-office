import axios from "axios";
import { generateText, generateTextStream } from "./generationApi.js";

// Frontend should call the backend embedding endpoint. This keeps Ollama
// network access server-side and avoids exposing model details.
const BACKEND_API = import.meta.env.VITE_API_URL || ""; // e.g. '/api'

// Get embedding via backend service at POST /api/embeddings { text }
export const getEmbedding = async (text) => {
  console.log(
    "🔵 EMBEDDING REQUEST",
    "characters:",
    text?.length,
    "time:",
    new Date().toISOString()
  );

  const start = performance.now();

  try {
    const endpoint = (BACKEND_API || "") + "/embeddings";

    const response = await axios.post(endpoint, { text });

    console.log(
      "🟢 EMBEDDING DONE",
      "took:",
      `${((performance.now() - start) / 1000).toFixed(2)}s`
    );

    return response.data.embedding;
  } catch (error) {
    console.error("🔴 EMBEDDING FAILED:", error);
    return null;
  }
};

// Generate text via backend (non-streaming, simple API)
export const generateResponse = async (prompt, oldText) => {
  const userContent = `المهمة: ${prompt}\n\nالنص الحالي:\n${oldText}`;
  return await generateText(userContent);
};

// Generate text via backend with streaming (real-time chunks)
export const generateResponseStream = async (prompt, oldText, onChunk) => {
  const userContent = `المهمة: ${prompt}\n\nالنص الحالي:\n${oldText}`;
  return await generateTextStream(userContent, onChunk);
};
