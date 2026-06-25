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
