import { searchArticles } from "../api/articleSearch.js";

/**
 * Smart pick service: handles semantic search for articles
 * and returns the best matching article with metadata.
 */
export const handleSmartPickArticles = async (companyId, prompt, topK = 3) => {
  if (!companyId || !prompt) {
    return {
      success: false,
      message: "Company ID or prompt missing",
      results: [],
      bestArticle: null,
      bestScore: null,
    };
  }

  try {
    // Call backend search
    const results = await searchArticles(companyId, prompt, topK);

    if (!results || results.length === 0) {
      return {
        success: false,
        message: "لم يتم العثور على مادة مطابقة.",
        results: [],
        bestArticle: null,
        bestScore: null,
      };
    }

    // Extract best result
    const bestArticle = results[0];
    const bestScore = bestArticle.score;

    // Check threshold (adjust as needed: 0.3-0.7)
    const SIMILARITY_THRESHOLD = 0.3;
    if (bestScore < SIMILARITY_THRESHOLD) {
      return {
        success: false,
        message: "لم يتم العثور على مادة مطابقة بشكل كافٍ.",
        results,
        bestArticle: null,
        bestScore,
      };
    }

    return {
      success: true,
      message: `✓ تم اختيار المادة رقم ${bestArticle.articleId} (درجة التطابق: ${(bestScore * 100).toFixed(1)}%)`,
      results,
      bestArticle: {
        id: bestArticle.articleId,
        title: `المادة #${bestArticle.articleId}`,
        content: bestArticle.content,
      },
      bestScore,
    };
  } catch (err) {
    console.error("Smart search error:", err);
    return {
      success: false,
      message: "حدث خطأ أثناء البحث.",
      results: [],
      bestArticle: null,
      bestScore: null,
    };
  }
};
