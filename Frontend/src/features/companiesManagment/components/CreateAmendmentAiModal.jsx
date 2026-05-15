import { useEffect, useState, useCallback, useRef } from "react"; // Cach
import { mockArticles } from "../../../shared/data/mockData";
import { generateResponse } from "../../../api/ollamaClient.js";
import { getEmbedding } from "../../../api/ollamaClient.js";


// ─────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────
function createEmptySection(index, existing = {}) {
  return {
    id: existing.id || `section-${index + 1}-${Date.now()}`,
    selectedArticleId: existing.selectedArticleId || "",
    selectedArticleTitle: existing.selectedArticleTitle || "",
    beforeText: existing.beforeText || "",
    afterText: existing.afterText || "",
    prompt: existing.prompt || "",
  };
}


// ─────────────────────────────────────────────────────────
// Document Loading Animation
// ─────────────────────────────────────────────────────────
function DocumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-5">
      <div className="relative w-14 h-18">
        {/* Page shadow */}
        <div className="absolute top-1 left-1 w-12 h-16 bg-slate-200 rounded-lg" />
        {/* Main document */}
        <div className="relative w-12 h-16 bg-white border-2 border-slate-300 rounded-lg shadow-md overflow-hidden">
          {/* Folded corner */}
          <div
            className="absolute top-0 right-0 w-4 h-4 bg-slate-100"
            style={{
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              borderLeft: "2px solid #cbd5e1",
              borderBottom: "2px solid #cbd5e1",
            }}
          />
          {/* Animated content lines */}
          <div className="absolute inset-0 flex flex-col justify-end p-2 pt-5 gap-1.5">
            {[100, 100, 100, 60].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full bg-emerald-300"
                style={{
                  width: `${w}%`,
                  animation: `pulse 1.2s ease-in-out ${i * 150}ms infinite`,
                  opacity: 0.7 + i * 0.075,
                }}
              />
            ))}
          </div>
        </div>
        {/* Sparkle badge */}
        <div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full
                     bg-gradient-to-br from-emerald-400 to-teal-600
                     flex items-center justify-center shadow-md"
          style={{ animation: "bounce 1s ease-in-out infinite" }}
        >
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-500 animate-pulse tracking-wide">
        يعمل الذكاء الاصطناعي…
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Article Picker Overlay
// ─────────────────────────────────────────────────────────
function ArticlePickerOverlay({ articles, selectedId, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? articles.filter(
        (a) =>
          String(a.title ?? "").includes(search) ||
          String(a.content ?? "").includes(search) ||
          String(a.id).includes(search)
      )
    : articles;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl
                   max-h-[82vh] flex flex-col overflow-hidden
                   animate-[slideUp_0.25s_ease-out]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-extrabold text-lg">اختر مادة</h3>
            <p className="text-emerald-100 text-xs mt-0.5">
              {articles.length} مادة متاحة
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

       {/* Search Section */}
<div className="px-5 py-3 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
    <div className="relative flex-1">
      {/* Icon Search */}
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        
        placeholder="ابحث بالكلمات الحرفية…"
        className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-4 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
        autoFocus
      />
    </div>
  </div>
</div>
        {/* Articles */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            filtered.map((article) => {
              const isSelected = String(article.id) === String(selectedId);
              return (
                <div
                  key={article.id}
                  onClick={() => {
                    onSelect(article);
                    onClose();
                  }}
                  className={`group relative rounded-2xl p-4 border-2 transition-all duration-200 cursor-pointer
                              hover:shadow-md
                              ${isSelected
                                ? "border-emerald-400 bg-emerald-50"
                                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                              }`}
                >
                  <div className="flex items-start gap-3">
                    {/* ID badge */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors
                                  ${isSelected
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                                  }`}
                    >
                      {article.id}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-2 mb-1 justify-between flex-wrap">
                        <h4
                          className={`font-bold text-sm transition-colors
                                      ${isSelected ? "text-emerald-800" : "text-slate-800 group-hover:text-emerald-700"}`}
                        >
                          {article.title}
                        </h4>
                        {article.subtitle && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {article.subtitle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {article.content}
                      </p>
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center self-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Article Section
// ─────────────────────────────────────────────────────────
function ArticleSection({
  index,
  section,
  availableArticles,
  onChangeSection,
  getCachedEmbedding, // Cach
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [smartSearching, setSmartSearching] = useState(false);
  const [smartSearchNote, setSmartSearchNote] = useState("");
  const [smartSearchScore, setSmartSearchScore] = useState(null); // Cach
  const [smartSearchResults, setSmartSearchResults] = useState([]);

  const selectedArticle =
    availableArticles.find(
      (a) => String(a.id) === String(section.selectedArticleId)
    ) || null;

  const handlePickArticle = (article) => {
    onChangeSection(index, {
      selectedArticleId: article.id,
      selectedArticleTitle: article.title,
      beforeText: article.content,
    });
  };

  const handleSmartPick = async () => {
    if (!section.prompt) return;
    setSmartSearching(true);
    setSmartSearchNote("");
    setSmartSearchScore(null); // Cach
    setSmartSearchResults([]);
    try {
      const cosineSimilarity = (vecA, vecB) => {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        if (!magA || !magB) return 0;
        return dotProduct / (magA * magB);
      };

      const minSimilarity = 0.5;

      const queryVector = await getEmbedding(section.prompt);
      const scoredArticles = await Promise.all(
        availableArticles.map(async (article) => {
          const articleVector = await getCachedEmbedding( // Cach
            String(article.id), // Cach
            String(article.content ?? "") // Cach
          ); // Cach
          const score = cosineSimilarity(queryVector, articleVector);
          return { ...article, score };
        })
      );
      const sorted = scoredArticles.sort((a, b) => b.score - a.score);
      const topMatches = sorted.slice(0, 3);
      const topScore = sorted[0] ? sorted[0].score : null; // Cach
      setSmartSearchScore(topScore); // Cach
      setSmartSearchResults(topMatches);
      if (!topScore || topScore < minSimilarity) {
        setSmartSearchNote("لم يتم العثور على مادة مطابقة بشكل كافٍ.");
      }
    } catch (err) {
      console.error("Smart search error:", err);
    } finally {
      setSmartSearching(false);
    }
  };
 
  // send to ai
  const handleSend = async () => {
    if (!section.beforeText || !section.prompt) return;
    setLoading(true);
    onChangeSection(index, { afterText: "" });

    try {
      
      console.log("Generating AI response with prompt:", section.prompt);
      const data = await generateResponse(section.prompt, section.beforeText);
      console.log("Received AI response:", data);

      const cleanData = data.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      // ! use this or delete
      // const afterText =
      //   data.content
      //     ?.filter((b) => b.type === "text")
      //     .map((b) => b.text)
      //     .join("") || "لم يتم الحصول على رد من النموذج.";

      const afterText = cleanData || "لم يتم الحصول على رد من النموذج.";
      onChangeSection(index, { afterText });
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
        {/* Section header bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              {index + 1}
            </div>
            <span className="text-base font-bold text-slate-800">
              المادة #{index + 1}
            </span>
          </div>

          {/* Select Article button */}
          <button
            type="button"
            onClick={() => {
              setPickerOpen(true);
            }}
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
              {selectedArticle
                ? `م.${selectedArticle.id}: ${selectedArticle.title}`
                : "اختر مادة"}
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

              <div className="min-h-[170px] rounded-xl border border-emerald-100 bg-white p-3 text-sm">
                {loading ? (
                  <DocumentLoader />
                ) : section.afterText ? (
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {section.afterText}
                  </p>
                ) : (
                  <div className="h-full min-h-[140px] flex items-center justify-center text-xs text-slate-400 text-center px-4">
                    ستظهر نتيجة التعديل هنا بعد الضغط على إرسال
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">
              تعليمات التعديل للذكاء الاصطناعي
            </label>
            <textarea
              value={section.prompt}
              onChange={(e) => onChangeSection(index, { prompt: e.target.value })}
              rows={3}
              placeholder="مثال: غيّر نسبة رأس المال إلى 30٪، وأضف بنداً يتعلق بحقوق المساهمين..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 resize-y"
            />
          </div>

          {/* Send */}
          <div className="flex justify-end">
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
          {smartSearchNote && (
            <p className="text-xs text-amber-600 text-right">{smartSearchNote}</p>
          )}
          {smartSearchResults.length > 0 && (
            <div className="space-y-2" dir="rtl">
              <p className="text-xs text-slate-500 text-right">
                اختر أفضل نتيجة من الاقتراحات:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {smartSearchResults.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => handlePickArticle(article)}
                    className="text-right rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-emerald-300 hover:bg-emerald-50 transition"
                  >
                    <div className="font-semibold text-slate-700">
                      م.{article.id}: {article.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      درجة: {article.score.toFixed(3)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {smartSearchScore !== null && ( // Cach
            <p className="text-xs text-slate-500 text-right"> 
              درجة التطابق: {smartSearchScore.toFixed(3) *100.00 } %
            </p> // Cach
          )} 
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Shared form state (modal + full page)
// ─────────────────────────────────────────────────────────
function useCreateAmendmentAiForm(company, articlesFromProps) {
  const [articleCount, setArticleCount] = useState(1);
  const [sections, setSections] = useState([createEmptySection(0)]);
  const embeddingCacheRef = useRef(new Map()); // Cach
  const pendingEmbeddingsRef = useRef(new Map()); // Cach

  const availableArticles =
    articlesFromProps && articlesFromProps.length > 0
      ? articlesFromProps
      : mockArticles;

  useEffect(() => {
    setArticleCount(1);
    setSections([createEmptySection(0)]);
  }, [company?.id]);

  useEffect(() => {
    setSections((prev) => {
      if (prev.length === articleCount) return prev;
      return Array.from({ length: articleCount }, (_, i) =>
        createEmptySection(i, prev[i])
      );
    });
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
      sections: sections.map(({ id, selectedArticleId, beforeText, afterText, prompt }) => ({
        id,
        selectedArticleId,
        beforeText,
        afterText,
        prompt,
      })),
    }),
    [company, articleCount, sections]
  );

  const getCachedEmbedding = useCallback(async (key, text) => { // Cach
    // In-memory cache to avoid recomputing article embeddings each click. // Cach
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

function AmendmentAiFormFields({
  availableArticles,
  articleCount,
  handleCountChange,
  sections,
  handleChangeSection,
  onCreateClick,
  getCachedEmbedding, // Cach
}) {
  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-base font-bold text-slate-800 mb-0.5">
              عدد المواد المراد تعديلها
            </h2>
            <p className="text-xs text-slate-500">
              حدد عدد المواد ثم اختر كل مادة واكتب تعليمات التعديل
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCountChange(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all cursor-pointer
                             ${articleCount === n
                               ? "bg-emerald-600 text-white shadow-sm"
                               : "bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700"
                             }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => handleCountChange(articleCount - 1)}
                disabled={articleCount <= 1}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <input
                type="number"
                min="1"
                max="20"
                value={articleCount}
                onChange={(e) => handleCountChange(e.target.value)}
                className="w-12 h-10 text-center text-base font-extrabold text-slate-800 border-x-2 border-slate-200
                           focus:outline-none bg-white"
              />
              <button
                type="button"
                onClick={() => handleCountChange(articleCount + 1)}
                disabled={articleCount >= 20}
                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-3">
          {articleCount === 1 ? "مادة واحدة" : `${articleCount} مواد`}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-6">
        {sections.map((section, index) => (
          <ArticleSection
            key={section.id}
            index={index}
            section={section}
            availableArticles={availableArticles}
            onChangeSection={handleChangeSection}
            getCachedEmbedding={getCachedEmbedding} // Cach
          />
        ))}
      </div>

      <div className="flex justify-end pt-2 pb-4">
        <button
          type="button"
          onClick={onCreateClick}
          className="flex items-center gap-2.5 px-8 py-3 rounded-2xl text-sm font-extrabold
                     bg-gradient-to-l from-slate-800 to-slate-700 text-white
                     hover:shadow-xl hover:shadow-slate-300 hover:-translate-y-0.5
                     transition-all duration-200 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          إنشاء
        </button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Full page (route: …/type/amendment/Ai)
// ─────────────────────────────────────────────────────────
export function CreateAmendmentAiPageView({
  company,
  availableArticles: articlesFromProps,
  onBack,
  onSubmit,
}) {
  const {
    availableArticles,
    articleCount,
    handleCountChange,
    sections,
    handleChangeSection,
    getPayload,
    getCachedEmbedding, // Cach
  } = useCreateAmendmentAiForm(company, articlesFromProps);

  const handleCreate = () => onSubmit?.(getPayload());

  return (
    <div className="flex flex-col min-h-0 flex-1 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden" dir="rtl">
      <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-teal-700 shadow-md">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-white font-extrabold text-xl md:text-2xl leading-tight">
              إنشاء عقد تعديل بالذكاء الاصطناعي
            </h1>
            {company?.name && (
              <p className="text-emerald-100 text-sm mt-1 truncate">الشركة: {company.name}</p>
            )}
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-shrink-0 flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium
                         hover:bg-white/10 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              رجوع
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-8 space-y-6 max-w-5xl mx-auto w-full">
        <AmendmentAiFormFields
          availableArticles={availableArticles}
          articleCount={articleCount}
          handleCountChange={handleCountChange}
          sections={sections}
          handleChangeSection={handleChangeSection}
          onCreateClick={handleCreate}
          getCachedEmbedding={getCachedEmbedding} // Cach
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Modal — open from any button via parent state + onClose
// ─────────────────────────────────────────────────────────
export default function CreateAmendmentAiModal({
  company,
  availableArticles: articlesFromProps,
  onClose,
  onSubmit,
}) {
  const {
    availableArticles,
    articleCount,
    handleCountChange,
    sections,
    handleChangeSection,
    getPayload,
    getCachedEmbedding, // Cach
  } = useCreateAmendmentAiForm(company, articlesFromProps);

  const handleCreate = () => onSubmit?.(getPayload());

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-3 md:p-6"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-amendment-ai-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-default"
        aria-label="إغلاق"
        onClick={() => onClose?.()}
      />

      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-50 shadow-2xl overflow-hidden animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-teal-700 shadow-md px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1
              id="create-amendment-ai-title"
              className="text-white font-extrabold text-lg md:text-xl leading-tight truncate"
            >
              إنشاء عقد تعديل بالذكاء الاصطناعي
            </h1>
            {company?.name && (
              <p className="text-emerald-100 text-xs md:text-sm mt-1 truncate">
                الشركة: {company.name}
              </p>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium
                         hover:bg-white/10 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden sm:inline">إغلاق</span>
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
          <AmendmentAiFormFields
            availableArticles={availableArticles}
            articleCount={articleCount}
            handleCountChange={handleCountChange}
            sections={sections}
            handleChangeSection={handleChangeSection}
            onCreateClick={handleCreate}
            getCachedEmbedding={getCachedEmbedding} // Cach
          />
        </div>
      </div>
    </div>
  );
}