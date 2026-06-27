// ─────────────────────────────────────────────────────────
// Data / Utility Helpers
// ─────────────────────────────────────────────────────────

export function createEmptySection(index, existing = {}) {
  return {
    id: existing.id || `section-${index + 1}-${Date.now()}`,
    selectedArticleId: existing.selectedArticleId || "",
    selectedArticleTitle: existing.selectedArticleTitle || "",
    beforeText: existing.beforeText || "",
    afterText: existing.afterText || "",
    modelOutput: existing.modelOutput || "",
    embeddingScore: existing.embeddingScore ?? null,
    prompt: existing.prompt || "",
  };
}
