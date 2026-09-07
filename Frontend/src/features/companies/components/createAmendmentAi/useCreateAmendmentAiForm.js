// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// useCreateAmendmentAiForm â€” shared form state hook
//   Used by both the modal and the full-page view.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import { useState, useEffect, useCallback, useRef } from "react";
import { getEmbedding } from "../../../../api/ollamaClient.js";
import { createEmptySection } from "./amendmentUtils.js";

export function useCreateAmendmentAiForm(company, articlesFromProps) {
  const [articleCount, setArticleCount] = useState(1);
  const [sections, setSections] = useState([createEmptySection(0)]);
  const embeddingCacheRef = useRef(new Map()); // Cach
  const pendingEmbeddingsRef = useRef(new Map()); // Cach

  const availableArticles = Array.isArray(articlesFromProps) ? articlesFromProps : [];

  // Reset form when the selected company changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setArticleCount(1);
      setSections([createEmptySection(0)]);
    }, 0);
    return () => clearTimeout(timer);
  }, [company?.id]);

  // Sync sections array length to articleCount
  useEffect(() => {
    const timer = setTimeout(() => {
      setSections((prev) => {
        if (prev.length === articleCount) return prev;
        return Array.from({ length: articleCount }, (_, i) =>
          createEmptySection(i, prev[i])
        );
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [articleCount]);

  const handleChangeSection = (index, patch) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const handleCountChange = (val) => {
    const n = Math.min(20, Math.max(1, Number(val) || 1));
    setArticleCount(n);
  };

  const getPayload = useCallback(
    () => ({
      company,
      articleCount,
      sections: sections.map(
        ({ id, selectedArticleId, selectedArticleTitle, beforeText, afterText, amendmentTitle, prompt, modelOutput, embeddingScore }) => ({
          id,
          selectedArticleId,
          selectedArticleTitle,
          beforeText,
          afterText,
          amendmentTitle,
          prompt,
          modelOutput,
          embeddingScore,
        })
      ),
    }),
    [company, articleCount, sections]
  );

  /**
   * In-memory embedding cache to avoid recomputing article vectors on every
   * smart-search click. Pending promises are de-duplicated so concurrent
   * callers share a single in-flight request per key.
   */
  const getCachedEmbedding = useCallback(async (key, text) => { // Cach
    if (embeddingCacheRef.current.has(key)) { // Cach
      return embeddingCacheRef.current.get(key); // Cach
    } // Cach

    if (pendingEmbeddingsRef.current.has(key)) { // Cach
      return pendingEmbeddingsRef.current.get(key); // Cach
    } // Cach

    const request = getEmbedding(text).then((vector) => { // Cach
      embeddingCacheRef.current.set(key, vector); // Cach
      pendingEmbeddingsRef.current.delete(key); // Cach
      return vector; // Cach
    }); // Cach

    pendingEmbeddingsRef.current.set(key, request); // Cach
    return request; // Cach
  }, []); // Cach

  // Prefetch article embeddings in the background (throttled) so a later
  // smart-search doesn't trigger many simultaneous embedding requests.
  useEffect(() => {
    if (!availableArticles || availableArticles.length === 0) return;
    let cancelled = false;

    (async function prefetch() {
      const CONCURRENCY = 5; // tune this based on local Ollama capacity
      for (let i = 0; i < availableArticles.length; i += CONCURRENCY) {
        if (cancelled) break;
        const batch = availableArticles.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map((a) =>
            getCachedEmbedding(String(a.id), String(a.content ?? "")).catch(() => null)
          )
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [availableArticles, getCachedEmbedding]);

  return {
    availableArticles,
    articleCount,
    handleCountChange,
    sections,
    handleChangeSection,
    getPayload,
    getCachedEmbedding, // Cach
  };
}
