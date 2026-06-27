import { useMemo, useState } from "react";
import { Loader2, Upload, Pencil } from "lucide-react";
import { Modal } from "../../../shared/components/HrShared";
import { createCompanyFromOcr, uploadPdfForOcr } from "../../../api/companies";
import { getApiErrorMessage } from "../../../utils/apiError";

const initialCompanyForm = {
  company_name: "",
  company_address: "",
  company_type: "",
  law_reference: { law_number: "", law_year: "" },
  company_capital: "",
  commercial_register_number: "",
  approval_date: "",
  company_duration: "",
  company_activity: "",
};

export default function NewCompanyModal({ onClose, onCreated }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [companyForm, setCompanyForm] = useState(initialCompanyForm);
  const [articles, setArticles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingOcr, setLoadingOcr] = useState(false);
  const [error, setError] = useState(null);

  const handlePdfChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setError(null);
    setLoadingOcr(true);
    setOcrData(null);

    try {
      const ocrResult = await uploadPdfForOcr(file);
      const parsed = {
        company_name: ocrResult.company_name || "",
        company_address: ocrResult.company_address || "",
        company_type: ocrResult.company_type || "",
        law_reference: ocrResult.law_reference || {},
        company_capital: ocrResult.company_capital || "",
        commercial_register_number: ocrResult.commercial_register_number || "",
        approval_date: ocrResult.approval_date || "",
        company_duration: ocrResult.company_duration || "",
        company_activity: ocrResult.company_activity || "",
      };

      setCompanyForm(parsed);
      setArticles(Array.isArray(ocrResult.articles) ? ocrResult.articles : []);
      setOcrData(ocrResult);
    } catch (e) {
      setError(getApiErrorMessage(e, "فشل استخراج نص العقد من ملف PDF."));
      setPdfFile(null);
    } finally {
      setLoadingOcr(false);
    }
  };

  const parsedArticleInputs = useMemo(() => {
    return articles.map((article, index) => ({
      index,
      id: article.id || "",
      value: article.value || "",
    }));
  }, [articles]);

  const updateArticle = (index, key, value) => {
    setArticles((prev) => prev.map((article, idx) => {
      if (idx !== index) return article;
      return { ...article, [key]: value };
    }));
  };

  const handleFieldChange = (field) => (event) => {
    const value = event.target.value;
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!pdfFile) {
      setError("اختر ملف PDF أولاً ثم انتظر انتهاء المعالجة.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const companyPayload = {
        ...companyForm,
        law_reference: companyForm.law_reference || {},
      };

      const result = await createCompanyFromOcr(companyPayload, pdfFile, {
        ...ocrData,
        articles,
      });

      onCreated(result);
    } catch (e) {
      setError(getApiErrorMessage(e, "فشل إنشاء الشركة من بيانات العقد."));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = "w-full rounded-2xl border border-appBorder bg-appMuted/80 px-4 py-3 text-sm text-appText outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <Modal
      title="إضافة شركة جديدة"
      subtitle="ارفع ملف PDF للعقد، عدل البيانات إذا لزم الأمر، ثم اضغط إنشاء." 
      onClose={() => {
        if (!submitting) onClose();
      }}
      size="xl"
      bodyScroll
      busy={submitting || loadingOcr}
      footer={
        <>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-xl border border-appBorder bg-appMuted px-4 py-2 text-sm font-medium text-appText ui-transition hover:bg-appBorder/40 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={submitting || !pdfFile || loadingOcr}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-panel ui-transition hover:bg-brandDeep disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            إنشاء الشركة
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {error && (
          <div className="rounded-2xl border border-danger/30 bg-badgeRedBg/25 px-4 py-3 text-sm text-appText">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
              ملف العقد PDF
            </label>
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-appBorder bg-appMuted px-4 py-3 text-sm text-appText shadow-sm transition hover:border-brand/70"
              htmlFor="company-pdf-input"
            >
              <span>{pdfFile ? pdfFile.name : "اختر ملف PDF"}</span>
              <Upload size={16} />
            </label>
            <input
              id="company-pdf-input"
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className="mt-2 hidden"
            />
            {loadingOcr && (
              <p className="mt-2 text-sm text-appSubtext">جارٍ استخراج البيانات من PDF...</p>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">حالة المعالجة</p>
            <div className="mt-3 rounded-3xl border border-appBorder bg-appMuted/70 p-4 text-sm text-appText">
              <p>اختر ملف PDF ثم انتظر معالجة OCR.</p>
              <p className="mt-2 text-appSubtext">يمكنك تعديل الحقول قبل الحفظ النهائي.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
              اسم الشركة
            </label>
            <input
              className={fieldClass}
              placeholder="مثال: الشركة الوطنية"
              value={companyForm.company_name}
              onChange={handleFieldChange("company_name")}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
              عنوان الشركة
            </label>
            <input
              className={fieldClass}
              placeholder="مثال: الرياض، السعودية"
              value={companyForm.company_address}
              onChange={handleFieldChange("company_address")}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
              نوع الشركة
            </label>
            <input
              className={fieldClass}
              placeholder="مثال: ذات مسؤولية محدودة"
              value={companyForm.company_type}
              onChange={handleFieldChange("company_type")}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
              رقم السجل التجاري
            </label>
            <input
              className={fieldClass}
              placeholder="مثال: 1010203040"
              value={companyForm.commercial_register_number}
              onChange={handleFieldChange("commercial_register_number")}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
              تاريخ الموافقة
            </label>
            <input
              className={fieldClass}
              placeholder="مثال: 2024-01-01"
              value={companyForm.approval_date}
              onChange={handleFieldChange("approval_date")}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
              مدة الشركة
            </label>
            <input
              className={fieldClass}
              placeholder="مثال: 99 سنة"
              value={companyForm.company_duration}
              onChange={handleFieldChange("company_duration")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
              نشاط الشركة
            </label>
            <input
              className={fieldClass}
              placeholder="مثال: تجارة عامة"
              value={companyForm.company_activity}
              onChange={handleFieldChange("company_activity")}
            />
          </div>
              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
                رقم القانون
              </label>
              <input
                className={fieldClass}
                placeholder="مثال: 159"
                value={companyForm.law_reference.law_number || ""}
                onChange={(e) =>
                  setCompanyForm((prev) => ({
                    ...prev,
                    law_reference: { ...prev.law_reference, law_number: e.target.value },
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-appSubtext">
                سنة القانون
              </label>
              <input
                className={fieldClass}
                placeholder="مثال: 1981"
                value={companyForm.law_reference.law_year || ""}
                onChange={(e) =>
                  setCompanyForm((prev) => ({
                    ...prev,
                    law_reference: { ...prev.law_reference, law_year: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>

        {articles.length > 0 ? (
          <div className="space-y-4 rounded-3xl border border-appBorder bg-appMuted/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-appText">بيانات المواد المستخرجة</p>
                <p className="text-xs text-appSubtext">يمكنك تعديل العناوين والقيم قبل إنشاء الشركة.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-appSurface px-3 py-2 text-xs font-semibold text-appText shadow-sm">
                <Pencil size={14} /> تعديل المواد
              </div>
            </div>
            <div className="grid gap-4">
              {parsedArticleInputs.map(({ index, id, value }) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-appSubtext">
                      رقم المادة
                    </label>
                    <input
                      className={fieldClass}
                      value={id}
                      onChange={(e) => updateArticle(index, "id", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-appSubtext">
                      نص المادة
                    </label>
                    <input
                      className={fieldClass}
                      value={value}
                      onChange={(e) => updateArticle(index, "value", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-appBorder bg-appMuted/70 p-5 text-sm text-appSubtext">
            لا توجد مواد مستخرجة بعد. ارفع عقد PDF لعرض مقترح المواد.
          </div>
        )}
      </div>
    </Modal>
  );
}
