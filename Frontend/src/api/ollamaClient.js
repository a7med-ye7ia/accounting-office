import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";
const MODEL_NAME = "qwen-local";

export const generateResponse = async (prompt, oldText) => {
  try {
    const userContent = `المهمة: ${prompt}\n\nالنص الحالي:\n${oldText}`;

    const response = await axios.post(OLLAMA_URL, {
      model: MODEL_NAME,
      prompt: userContent,
      stream: false
    });

    return response.data.response;
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};