import apiClient from "./client";

export const searchArticles = async (companyId, query, topK = 3) => {
  console.log("Searching articles for company ID:", companyId);
  try {
    const response = await apiClient.post("/articles/search", {
      companyId: Number(companyId),
      query,
      topK,
    });
    return response.data; // List of { articleId, content, score, companyId }
  } catch (error) {
    console.error("Article search error:", error);
    return [];
  }
};
