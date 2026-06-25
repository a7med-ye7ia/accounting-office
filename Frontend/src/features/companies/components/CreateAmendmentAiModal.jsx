// ─────────────────────────────────────────────────────────
// CreateAmendmentAiModal — modal entry point
//
// This file is the public surface kept at its original path
// so that existing imports elsewhere in the project do not
// need to change.  All logic lives in ./createAmendmentAi/.
// ─────────────────────────────────────────────────────────
import { useEffect } from "react";
import { useCreateAmendmentAiForm } from "./createAmendmentAi/useCreateAmendmentAiForm.js";
import AmendmentAiFormFields from "./createAmendmentAi/AmendmentAiFormFields.jsx";

// Re-export the page view so consumers can import it from
// the same place they previously found it.
export { CreateAmendmentAiPageView } from "./createAmendmentAi/CreateAmendmentAiPageView.jsx";

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

  // Close on Escape
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
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm cursor-default"
        aria-label="إغلاق"
        onClick={() => onClose?.()}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-50 shadow-2xl overflow-hidden animate-[slideUp_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
          <AmendmentAiFormFields
            availableArticles={availableArticles}
            articleCount={articleCount}
            handleCountChange={handleCountChange}
            sections={sections}
            handleChangeSection={handleChangeSection}
            onCreateClick={handleCreate}
            company={company}
            getCachedEmbedding={getCachedEmbedding} // Cach
          />
        </div>
      </div>
    </div>
  );
}
