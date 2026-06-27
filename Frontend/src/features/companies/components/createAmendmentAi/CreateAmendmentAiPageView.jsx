// ─────────────────────────────────────────────────────────
// CreateAmendmentAiPageView — full-page route view
//   Route: …/type/amendment/Ai
// ─────────────────────────────────────────────────────────
import { useCreateAmendmentAiForm } from "./useCreateAmendmentAiForm.js";
import AmendmentAiFormFields from "./AmendmentAiFormFields.jsx";

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
    <div
      className="flex flex-col min-h-0 flex-1 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
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

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6 py-8 space-y-6 max-w-5xl mx-auto w-full">
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
  );
}
