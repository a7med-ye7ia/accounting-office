// ─────────────────────────────────────────────────────────
// AmendmentAiFormFields — article counter + section list +
//   PDF preview/download flow
// ─────────────────────────────────────────────────────────
import { useState, useCallback, useRef, useEffect } from "react";
import {
  createAmendmentPdfPreview,
  downloadAmendmentPdfPreview,
  getSectionEditsFromPdfPayload,
  regenerateAmendmentPdfPreview,
  revokeAmendmentPdfPreview,
} from "../../../../services/amendmentPdfService.js";
import PdfReviewModal from "./PdfReviewModal.jsx";
import ArticleSection from "./ArticleSection.jsx";

export default function AmendmentAiFormFields({
  company,
  availableArticles,
  articleCount,
  handleCountChange,
  sections,
  handleChangeSection,
  onCreateClick,
  getCachedEmbedding, // Cach
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRegeneratingPdf, setIsRegeneratingPdf] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [reviewPayload, setReviewPayload] = useState(null);
  const [hasPendingEdits, setHasPendingEdits] = useState(false);
  const renderedPayloadRef = useRef(null);

  // ── PDF preview lifecycle ─────────────────────────────

  const closePdfPreview = useCallback(() => {
    setPdfPreview((current) => {
      revokeAmendmentPdfPreview(current);
      return null;
    });
    setReviewPayload(null);
    setHasPendingEdits(false);
    renderedPayloadRef.current = null;
  }, []);

  // Revoke object URL on unmount / url change
  useEffect(
    () => () => {
      revokeAmendmentPdfPreview(pdfPreview);
    },
    [pdfPreview?.url]
  );

  const regeneratePdfFromPayload = useCallback(async (payload, fileName) => {
    const preview = await regenerateAmendmentPdfPreview(payload, fileName);
    setPdfPreview((current) => {
      revokeAmendmentPdfPreview(current);
      return preview;
    });
    renderedPayloadRef.current = JSON.stringify(payload);
    setHasPendingEdits(false);
  }, []);

  const handlePreviewPdf = async () => {
    if (!sections || sections.length === 0) return;
    setIsGeneratingPdf(true);
    try {
      const { preview, payload } = await createAmendmentPdfPreview(company, sections);
      setPdfPreview((current) => {
        revokeAmendmentPdfPreview(current);
        return preview;
      });
      setReviewPayload(payload);
      renderedPayloadRef.current = JSON.stringify(payload);
      setHasPendingEdits(false);
    } catch (err) {
      console.error("Error generating PDF preview:", err);
      alert("حدث خطأ أثناء إنشاء ملف الـ PDF. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleReviewPayloadChange = useCallback((updater) => {
    setReviewPayload((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const isDirty = JSON.stringify(next) !== renderedPayloadRef.current;
      setHasPendingEdits(isDirty);
      return next;
    });
  }, []);

  const handleRegeneratePreview = async () => {
    if (!reviewPayload || !pdfPreview?.fileName) return;
    setIsRegeneratingPdf(true);
    try {
      await regeneratePdfFromPayload(reviewPayload, pdfPreview.fileName);
    } catch (err) {
      console.error("Error regenerating PDF preview:", err);
      alert("حدث خطأ أثناء تحديث المعاينة. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsRegeneratingPdf(false);
    }
  };

  // Sync edits made inside the PDF review modal back to the main form state
  const syncReviewPayloadToSections = useCallback(() => {
    getSectionEditsFromPdfPayload(reviewPayload, sections).forEach(({ index, patch }) => {
      handleChangeSection(index, patch);
    });
  }, [reviewPayload, sections, handleChangeSection]);

  const handleApplyAndClose = () => {
    syncReviewPayloadToSections();
    closePdfPreview();
  };

  const handleDownloadPreview = () => {
    if (!pdfPreview || hasPendingEdits) return;
    downloadAmendmentPdfPreview(pdfPreview);
  };

  // ── Render ────────────────────────────────────────────
  return (
    <>
      {pdfPreview && reviewPayload && (
        <PdfReviewModal
          previewUrl={pdfPreview.url}
          fileName={pdfPreview.fileName}
          reviewPayload={reviewPayload}
          onReviewPayloadChange={handleReviewPayloadChange}
          onRegenerate={handleRegeneratePreview}
          onApplyAndClose={handleApplyAndClose}
          onClose={closePdfPreview}
          onDownload={handleDownloadPreview}
          isRegenerating={isRegeneratingPdf}
          hasPendingEdits={hasPendingEdits}
        />
      )}

      {/* Article count picker */}
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
            {/* Quick-pick buttons */}
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCountChange(n)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all cursor-pointer
                             ${
                               articleCount === n
                                 ? "bg-emerald-600 text-white shadow-sm"
                                 : "bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700"
                             }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Stepper */}
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

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-3">
          {articleCount === 1 ? "مادة واحدة" : `${articleCount} مواد`}
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* Article sections */}
      <div className="space-y-6">
        {sections.map((section, index) => (
          <ArticleSection
            key={section.id}
            index={index}
            section={section}
            availableArticles={availableArticles}
            onChangeSection={handleChangeSection}
            company={company}
          />
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="flex justify-end pt-2 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePreviewPdf}
            disabled={isGeneratingPdf || sections.length === 0}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                       ${
                         !isGeneratingPdf && sections.length > 0
                           ? "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50 hover:shadow-md"
                           : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                       }`}
          >
            {isGeneratingPdf ? "جاري الإنشاء..." : "مراجعة وتعديل PDF"}
            {!isGeneratingPdf && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>

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
      </div>
    </>
  );
}
