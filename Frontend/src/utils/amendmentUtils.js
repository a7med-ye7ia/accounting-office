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
    amendmentTitle: existing.amendmentTitle || existing.amendment_title || "",
    modelOutput: existing.modelOutput || "",
    embeddingScore: existing.embeddingScore ?? null,
    prompt: existing.prompt || "",
  };
}

export function buildCatInstruction(currentMaterialNumber, userInstruction) {
  const instruction = String(userInstruction || "")
    .replace(/^\s*تعديل\s+رقم\s+\d+\s*[:：-]\s*/i, "")
    .trim();
  const catAmendmentNumber = Number(currentMaterialNumber) + 1;
  return `تعديل رقم ${catAmendmentNumber} : ${instruction}`;
}

// CAT output can be JSON, HTML paragraphs, or plain text. This normalizer keeps
// the legal text intact and extracts a title only when its structure is explicit.
export function normalizeCatOutput(output) {
  let source = stripThinkingContent(output)
    .trim();
  let amendmentTitle = "";

  const unfenced = source.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  if (unfenced.startsWith("{")) {
    try {
      const json = JSON.parse(unfenced);
      amendmentTitle = json.amendment_title || json.amendmentTitle || json.introductory_title || json.introductoryTitle || json["العنوان التمهيدي"] || "";
      const amended = json.after_text ?? json.afterText ?? json["النص المعدل"] ?? "";
      source = Array.isArray(amended) ? amended.join("\n") : String(amended);
    } catch {
      // A malformed JSON response is treated as plain CAT output.
    }
  }

  source = cleanHtmlMarkup(source);
  amendmentTitle = cleanHtmlMarkup(amendmentTitle);

  if (!amendmentTitle) {
    const extracted = extractStructuredTitle(source);
    amendmentTitle = extracted.amendmentTitle;
    source = extracted.afterText;
  }

  return {
    amendmentTitle,
    afterText: removeModifiedTextLabel(removeLeadingDuplicateTitle(source, amendmentTitle)),
  };
}

// The CAT model emits its internal reasoning in explicit think/thinking tags.
// While an opening tag is incomplete or still open, nothing in that block is
// exposed to the user. Other angle-bracket content is left for HTML cleaning.
export function stripThinkingContent(output) {
  const source = String(output || "");
  const openingTag = /<(think|thinking)\b[^>]*>/gi;
  let visible = "";
  let cursor = 0;
  let opening;

  while ((opening = openingTag.exec(source))) {
    visible += source.slice(cursor, opening.index);
    const closingTag = /<\/(?:think|thinking)\s*>/ig;
    closingTag.lastIndex = openingTag.lastIndex;
    const closing = closingTag.exec(source);
    if (!closing) return visible;
    cursor = closingTag.lastIndex;
    openingTag.lastIndex = cursor;
  }
  visible += source.slice(cursor);

  // Do not briefly render a think tag split across streaming chunks.
  return visible.replace(/<\/?(?:t|th|thi|thin|think|thinki|thinkin)$/i, "");
}

function cleanHtmlMarkup(text) {
  const decoder = document.createElement("textarea");
  decoder.innerHTML = String(text || "");
  return decoder.value
    .replace(/<\s*\/?\s*(?:p|div|br|li|tr|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<!--[\s\S]*?-->|<[^>]+>/g, "");
}

function extractStructuredTitle(text) {
  const labelled = text.match(/^\s*العنوان\s+التمهيد[يي]\s*[:：-]*\s*([^\r\n]+)(?:\r?\n+)([\s\S]+)$/i);
  if (labelled) return { amendmentTitle: labelled[1].trim(), afterText: labelled[2].trimStart() };

  // Arabic ordinal + separator is CAT's explicit introductory-title format.
  const ordinal = text.match(/^\s*((?:أولاً|اولا|أولى|ثانياً|ثانيا|ثانية|ثالثاً|ثالثا|رابعاً|رابعا|خامساً|خامسا|سادساً|سادسا|سابعاً|سابعا|ثامناً|ثامنا|تاسعاً|تاسعا|عاشراً|عاشرا)\s*[:：-]+\s*[^\r\n]+)(?:\r?\n+)([\s\S]+)$/i);
  if (ordinal) return { amendmentTitle: ordinal[1].trim(), afterText: ordinal[2].trimStart() };

  return { amendmentTitle: "", afterText: text };
}

function removeLeadingDuplicateTitle(text, title) {
  if (!title) return text;
  const labelled = text.match(/^\s*العنوان\s+التمهيد[يي]\s*[:：-]*\s*([^\r\n]+)(?:\r?\n+)([\s\S]+)$/i);
  if (labelled && comparable(labelled[1]) === comparable(title)) return labelled[2].trimStart();
  const match = text.match(/^\s*([^\r\n]+)(?:\r?\n+)([\s\S]+)$/);
  if (!match || comparable(match[1]) !== comparable(title)) return text;
  return match[2].trimStart();
}

function removeModifiedTextLabel(text) {
  return String(text || "").replace(/^\s*النص\s+المعدل\s*[:：-]+\s*/i, "");
}

function comparable(text) {
  return String(text)
    .replace(/[\sـ:：،,؛;\-–—.()[\]{}]/g, "")
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[ى]/g, "ي")
    .replace(/[أإآ]/g, "ا");
}
