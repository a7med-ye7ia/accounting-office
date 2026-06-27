// ─────────────────────────────────────────────────────────
// PdfReviewModal — side-by-side editor + iframe PDF preview
// ─────────────────────────────────────────────────────────
import { useState, useEffect } from "react";

export default function PdfReviewModal({
  previewUrl,
  fileName,
  reviewPayload,
  onReviewPayloadChange,
  onRegenerate,
  onApplyAndClose,
  onClose,
  onDownload,
  isRegenerating,
  hasPendingEdits,
}) {
  const [mobileTab, setMobileTab] = useState("edit");

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updateMeta = (field, value) => {
    onReviewPayloadChange((prev) => ({ ...prev, [field]: value }));
  };

  const updateSection = (index, patch) => {
    onReviewPayloadChange((prev) => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  };

  // ── Editor panel ──────────────────────────────────────
  const editorPanel = (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-800">تعديل محتوى العقد</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          عدّل النصوص ثم اضغط «تحديث المعاينة» لرؤية التغييرات في PDF
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">عنوان العقد</label>
          <input
            type="text"
            value={reviewPayload.contractTitle}
            onChange={(e) => updateMeta("contractTitle", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">اسم الشركة</label>
          <input
            type="text"
            value={reviewPayload.companyName}
            onChange={(e) => updateMeta("companyName", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">الوصف القانوني</label>
          <input
            type="text"
            value={reviewPayload.companyLegalLine}
            onChange={(e) => updateMeta("companyLegalLine", e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600">التمهيد</label>
          <textarea
            value={reviewPayload.introText}
            onChange={(e) => updateMeta("introText", e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {reviewPayload.sections.map((section, index) => (
          <div
            key={section.id || index}
            className="rounded-2xl border border-slate-200 p-4 space-y-3 bg-slate-50/50"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-sm font-bold text-slate-800">
                {section.selectedArticleTitle
                  ? `مادة: ${section.selectedArticleTitle}`
                  : `المادة #${index + 1}`}
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500">قبل التعديل</label>
              <textarea
                value={section.beforeText}
                onChange={(e) => updateSection(index, { beforeText: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-700">بعد التعديل</label>
              <textarea
                value={section.afterText}
                onChange={(e) => updateSection(index, { afterText: e.target.value })}
                rows={5}
                className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Preview panel ─────────────────────────────────────
  const previewPanel = (
    <div className="flex flex-col h-full min-h-0 bg-slate-100">
      {hasPendingEdits && (
        <div className="flex-shrink-0 px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800 text-center">
          لديك تعديلات غير مطبّقة — اضغط «تحديث المعاينة» لتحديث PDF
        </div>
      )}
      <iframe
        src={previewUrl}
        title="معاينة PDF"
        className="flex-1 min-h-0 w-full border-0"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-3 md:p-6"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-default"
        aria-label="إغلاق"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-7xl h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="pdf-preview-title" className="text-white font-extrabold text-lg">
              مراجعة وتعديل PDF
            </h2>
            <p className="text-blue-100 text-xs mt-1 truncate">{fileName}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Regenerate */}
            <button
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer
                         ${
                           !isRegenerating
                             ? "text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                             : "text-slate-400 bg-slate-100 cursor-not-allowed"
                         }`}
            >
              {isRegenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  جاري التحديث…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  تحديث المعاينة
                </>
              )}
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={onDownload}
              disabled={hasPendingEdits || isRegenerating}
              title={hasPendingEdits ? "حدّث المعاينة أولاً قبل التحميل" : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                         ${
                           !hasPendingEdits && !isRegenerating
                             ? "text-blue-700 bg-white hover:bg-blue-50 cursor-pointer"
                             : "text-slate-400 bg-white/60 cursor-not-allowed"
                         }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              تحميل
            </button>

            {/* Save & close */}
            <button
              type="button"
              onClick={onApplyAndClose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer"
            >
              حفظ وإغلاق
            </button>

            {/* X */}
            <button
              type="button"
              onClick={onClose}
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex-shrink-0 flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors
                       ${mobileTab === "edit" ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500"}`}
          >
            تعديل
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors
                       ${mobileTab === "preview" ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50" : "text-slate-500"}`}
          >
            معاينة
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2">
          <div className={`min-h-0 ${mobileTab === "edit" ? "block" : "hidden md:block"}`}>
            {editorPanel}
          </div>
          <div className={`min-h-0 border-r border-slate-200 ${mobileTab === "preview" ? "block" : "hidden md:block"}`}>
            {previewPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
