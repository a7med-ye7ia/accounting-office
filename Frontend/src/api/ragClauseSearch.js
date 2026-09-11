import axios from "axios";

const RAG_BASE_URL =
  import.meta.env.VITE_RAG_CLAUSE_API_URL ?? "http://localhost:8765";

/**
 * Clause-level search: splits `oldText` by مادة (n), Ollama embed + FAISS (optional).
 */
export async function searchClausesRag({ oldText, query, retrieveK = 10, finalK = 3 }) {
  const { data } = await axios.post(
    `${RAG_BASE_URL}/api/clause-rag/search`,
    {
      old_text: oldText ?? "",
      query: query ?? "",
      retrieve_k: retrieveK,
      final_k: finalK,
    },
    { timeout: 120_000 }
  );
  return data;
}

/**
 * Picks the single best article from `articles` using only `query` (Ollama embed + FAISS).
 * Response: { article_id, title, score } — match `article_id` to your list for full content.
 */
export async function pickArticleByPrompt({ articles, query }) {
  const { data } = await axios.post(
    `${RAG_BASE_URL}/api/article-rag/pick`,
    {
      query: query ?? "",
      articles: (articles ?? []).map((a) => ({
        id: a.id,
        title: a.title ?? "",
        subtitle: a.subtitle ?? "",
        content: a.content ?? "",
      })),
    },
    { timeout: 120_000 }
  );
  return data;
}
