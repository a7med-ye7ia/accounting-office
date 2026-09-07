// ─────────────────────────────────────────────────────────
// ArticleSection — per-article editing card
//   • article picker (opens ArticlePickerOverlay)
//   • before / after columns
//   • AI prompt input + send button
//   • smart semantic search
// ─────────────────────────────────────────────────────────
import { useState } from "react";
import { useParams } from "react-router-dom";
import { generateResponseStream } from "../../../../api/ollamaClient.js";
import { handleSmartPickArticles } from "../../../../services/smartPickService.js";
import MicButton from "../../../../shared/components/MicButton.jsx";
import DocumentLoader from "./DocumentLoader.jsx";
import ArticlePickerOverlay from "./ArticlePickerOverlay.jsx";
import { buildCatInstruction, normalizeCatOutput, stripThinkingContent } from "./amendmentUtils.js";

export default function ArticleSection({
  index,
  section,
  availableArticles,
  onChangeSection,
  company, // Company object with id
}) {
  const params = useParams();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamingOutput, setStreamingOutput] = useState("");
  const [hasReceivedFirstChunk, setHasReceivedFirstChunk] = useState(false);
  const [smartSearching, setSmartSearching] = useState(false);
  const [smartSearchNote, setSmartSearchNote] = useState("");
  const [smartSearchScore, setSmartSearchScore] = useState(null); // Cach
  const [smartSearchResults, setSmartSearchResults] = useState([]);

  const selectedArticle =
    availableArticles.find(
      (a) => String(a.id) === String(section.selectedArticleId)
    ) || null;

  // ── Handlers ─────────────────────────────────────────

  const handlePickArticle = (article) => {
    onChangeSection(index, {
      selectedArticleId: article.id,
      selectedArticleTitle: article.title,
      beforeText: article.content,
    });
  };

  const handleSmartPick = async () => {
    const resolvedCompanyId = company?.id ?? params?.companyId ?? (typeof company === "number" || typeof company === "string" ? company : null);

    if (!section.prompt?.trim()) {
      setSmartSearchNote("يرجى كتابة تعليمات التعديل أولاً للبحث عن المادة المناسبة.");
      return;
    }

    if (!resolvedCompanyId) {
      console.warn("Smart search: company object missing ID", company);
      setSmartSearchNote("تعذر التعرّف على رقم الشركة الحالية.");
      return;
    }

    setSmartSearching(true);
    setSmartSearchNote("");
    setSmartSearchScore(null);
    setSmartSearchResults([]);

    try {
      const result = await handleSmartPickArticles(
        resolvedCompanyId,
        section.prompt,
        3 // topK
      );

      if (result.success && result.bestArticle) {
        // Pick the best article from backend search
        handlePickArticle({
          id: result.bestArticle.id,
          title: result.bestArticle.title,
          content: result.bestArticle.content,
        });
      }

      setSmartSearchNote(result.message);
      setSmartSearchScore(result.bestScore);
      setSmartSearchResults(result.results || []);
    } catch (err) {
      console.error("Smart search error:", err);
      setSmartSearchNote("حدث خطأ أثناء إجراء البحث الذكي.");
    } finally {
      setSmartSearching(false);
    }
  };

  // Send to AI
  const handleSend = async () => {
    if (!section.beforeText || !section.prompt) return;
    setLoading(true);
    setStreamingOutput("");
    setHasReceivedFirstChunk(false);
    onChangeSection(index, { afterText: "", amendmentTitle: "" });

    try {
      const currentMaterialNumber = index + 1;
      const catInstruction = buildCatInstruction(currentMaterialNumber, section.prompt);
      console.log("Generating AI response with numbered instruction:", catInstruction);
      const data = await generateResponseStream(catInstruction, section.beforeText, (completeText) => {
        const visibleText = stripThinkingContent(completeText);
        setStreamingOutput(visibleText);
        if (visibleText.trim()) setHasReceivedFirstChunk(true);
      });
      console.log("Received AI response:", data);

      const normalized = normalizeCatOutput(data);
      onChangeSection(index, {
        amendmentTitle: normalized.amendmentTitle,
        afterText: normalized.afterText || "لم يتم الحصول على رد من النموذج.",
      });
      // Retain a user-visible final result after generation; do not clear it.
      setStreamingOutput(normalized.afterText || stripThinkingContent(data));
    } catch (err) {
      console.error("AI request error:", err);
      onChangeSection(index, {
        afterText: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي. الرجاء المحاولة مرة أخرى.",
      });
    } finally {
      setLoading(false);
    }
  };

  const canSend = !!section.beforeText && !!section.prompt && !loading;

  // ── Render ────────────────────────────────────────────
  return (
    <>
      {pickerOpen && (
        <ArticlePickerOverlay
          articles={availableArticles}
          selectedId={section.selectedArticleId}
          onSelect={handlePickArticle}
          onClose={() => setPickerOpen(false)}
        />
      )}

      <div
        className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
        dir="rtl"
      >
        {/* Section header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              {index + 1}
            </div>
            <span className="text-base font-bold text-slate-800">المادة #{index + 1}</span>
          </div>

          {/* Select article button */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 cursor-pointer
                       ${selectedArticle
                ? "border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "border-slate-300 bg-white text-slate-600 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="max-w-[160px] truncate">
              {selectedArticle ? `م.${selectedArticle.id}: ${selectedArticle.title}` : "اختر مادة"}
            </span>
            {selectedArticle && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChangeSection(index, {
                    selectedArticleId: "",
                    selectedArticleTitle: "",
                    beforeText: "",
                    afterText: "",
                    amendmentTitle: "",
                  });
                }}
                className="mr-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                title="إلغاء الاختيار"
              >
                ✕
              </span>
            )}
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-5">
          {/* Before / After columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Before */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-sm font-bold text-slate-600">قبل التعديل</span>
              </div>
              <div
                className={`min-h-[170px] rounded-xl border text-sm leading-relaxed p-3
                            ${section.beforeText
                    ? "bg-white border-slate-200 text-slate-700"
                    : "bg-white border-dashed border-slate-300 flex items-center justify-center"
                  }`}
              >
                {section.beforeText ? (
                  <p className="whitespace-pre-wrap">{section.beforeText}</p>
                ) : (
                  <p className="text-slate-400 text-xs text-center">
                    اختر مادة لعرض محتواها هنا
                  </p>
                )}
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-emerald-700">بعد التعديل</span>
              </div>
              <div className="min-h-[170px] rounded-xl border border-emerald-100 bg-white text-sm">
                {loading ? (
                  <div className="p-3 space-y-3">
                    {!hasReceivedFirstChunk && <DocumentLoader />}
                    {streamingOutput && (
                      <p className="whitespace-pre-wrap text-slate-700 leading-relaxed" aria-live="polite">
                        {streamingOutput}
                      </p>
                    )}
                  </div>
                ) : section.afterText ? (
                  <textarea
                    value={section.afterText}
                    onChange={(e) => onChangeSection(index, { afterText: e.target.value })}
                    rows={8}
                    className="w-full min-h-[170px] rounded-xl border-0 bg-transparent p-3 text-slate-700 leading-relaxed resize-y
                               focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    aria-label="نص المادة بعد التعديل"
                  />
                ) : (
                  <div className="h-full min-h-[140px] flex items-center justify-center text-xs text-slate-400 text-center px-4">
                    ستظهر نتيجة التعديل هنا بعد الضغط على إرسال
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              تعليمات التعديل للذكاء الاصطناعي
            </label>
            <div className="flex items-start gap-2">
              <textarea
                value={section.prompt}
                onChange={(e) => onChangeSection(index, { prompt: e.target.value })}
                rows={3}
                placeholder="مثال: غيّر نسبة رأس المال إلى 30٪، وأضف بنداً يتعلق بحقوق المساهمين..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-y"
              />
              <MicButton
                value={section.prompt}
                onChange={(newPrompt) => onChangeSection(index, { prompt: newPrompt })}
                variant="slate"
                className="mt-1"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end">
            <div className="flex items-center gap-3">
              {/* Smart search */}
              <button
                type="button"
                onClick={handleSmartPick}
                disabled={!section.prompt || smartSearching}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                           ${section.prompt && !smartSearching
                    ? "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 hover:shadow-md hover:-translate-y-0.5"
                    : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  }`}
              >
                {smartSearching ? "جاري البحث..." : "بحث ذكي"}
                {!smartSearching && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>

              {/* Send to AI */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                           ${canSend
                    ? "bg-gradient-to-l from-emerald-600 to-teal-700 text-white cursor-pointer hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري الإرسال…
                  </>
                ) : (
                  <>
                    إرسال
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Smart search feedback */}
          {smartSearchNote && (
            <p className="text-xs text-amber-600 text-right">{smartSearchNote}</p>
          )}

          {smartSearchResults.length > 0 && (
            <div className="space-y-3" dir="rtl">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 text-right">اختر أفضل نتيجة من الاقتراحات:</p>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  أفضل 3 نتائج
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {smartSearchResults.map((article, idx) => (
                  <button
                    key={article.articleId}
                    type="button"
                    onClick={() => handlePickArticle({
                      id: article.articleId,
                      title: `المادة #${article.articleId}`,
                      content: article.content,
                    })}
                    className="text-right rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm
                               hover:border-emerald-300 hover:bg-emerald-50 hover:-translate-y-0.5 hover:shadow-md
                               transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {Math.round(article.score * 100)}%
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 line-clamp-2">
                      م.{article.articleId}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-2 line-clamp-3">
                      {article.content}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {smartSearchScore !== null && (
            <p className="text-xs text-slate-500 text-right">
              درجة التطابق: {(smartSearchScore * 100).toFixed(1)} %
            </p>
          )}
        </div>
      </div>
    </>
  );
}
