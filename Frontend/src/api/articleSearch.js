import axios from "axios";

const BACKEND_API = import.meta.env.VITE_API_URL || "";

export const searchArticles = async (companyId, query, topK = 5) => {
  try {
    const endpoint = (BACKEND_API || "") + "/api/articles/search";
    const response = await axios.post(endpoint, {
      companyId,
      query,
      topK,
    });
    return response.data; // List of { articleId, content, score, companyId }
  } catch (error) {
    console.error("Article search error:", error);
    return [];
  }
};
