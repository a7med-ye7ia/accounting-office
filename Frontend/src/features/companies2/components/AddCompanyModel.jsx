import { useState } from "react";
import {
  Building2,
  Check,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

import { uploadPdfForOcr, createCompanyFromOcr } from "../../../api/companies";


export default function AddCompanyModal({ isOpen, onClose, companies, setCompanies }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractedData, setExtractedData] = useState(null);

  if (!isOpen) return null;

  const handleResetAndClose = () => {
    setStep(1);
    setFile(null);
    setExtractedData(null);
    setIsExtracting(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STEP 1: UPLOAD & EXTRACT OCR
  |--------------------------------------------------------------------------
  */
  const handleExtractData = async () => {
    if (!file) return;

    setIsExtracting(true);

    try { 
      const data = await uploadPdfForOcr(file);
      setExtractedData(data);
      setStep(2);
    } catch (error) {
      console.error("Error extracting data from PDF:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STEP 2: SAVE & CREATE COMPANY
  |--------------------------------------------------------------------------
  */

  function buildCompanyRequest(ocrData) {
    return {
      company_name: ocrData.company_name,
      company_type: ocrData.company_type,
      company_address: ocrData.company_address,
      company_capital: ocrData.company_capital,
      // commercial_register_number: ocrData.commercial_register_number,
      commercial_register_number: new Date().toISOString(), // ! modify this !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      approval_date: ocrData.approval_date,
      company_duration: ocrData.company_duration,
      company_activity: ocrData.company_activity,
    };
  }

  const handleCreateCompany = async () => {
    setIsSubmitting(true);

    try {
      const createdCompany = await createCompanyFromOcr(buildCompanyRequest(extractedData), file, extractedData);
      setCompanies((prevCompanies) => [...prevCompanies, createdCompany]);
      setStep(3);
    } catch (error) {
      console.error("Error creating company:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-appBorder bg-appSurface shadow-2xl transition-all"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-appBorder p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-appText">إضافة شركة جديدة</h2>
              <p className="text-xs text-appSubtext">
                ارفع عقد التاسيس، راجع البيانات المستخرجة، ثم انشئ الشركة بنفس بيانات backend الحالية
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="rounded-lg p-1.5 text-appSubtext hover:bg-appMuted hover:text-appText"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Progress Steps Bar */}
        <div className="border-b border-appBorder bg-appMuted/50 px-6 py-4">
          <div className="flex items-center justify-between text-xs font-bold">
            <div
              className={`flex items-center gap-2 ${
                step >= 1 ? "text-brand" : "text-appSubtext"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
                  step > 1 ? "bg-emerald-500" : step === 1 ? "bg-brand" : "bg-appBorder"
                }`}
              >
                {step > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
              </span>
              رفع الملف
            </div>

            <div className={`h-0.5 flex-1 mx-3 ${step >= 2 ? "bg-brand" : "bg-appBorder"}`} />

            <div
              className={`flex items-center gap-2 ${
                step >= 2 ? "text-brand" : "text-appSubtext"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
                  step > 2 ? "bg-emerald-500" : step === 2 ? "bg-brand" : "bg-appBorder"
                }`}
              >
                {step > 2 ? <Check className="h-3.5 w-3.5" /> : "2"}
              </span>
              مراجعة البيانات
            </div>

            <div className={`h-0.5 flex-1 mx-3 ${step === 3 ? "bg-brand" : "bg-appBorder"}`} />

            <div
              className={`flex items-center gap-2 ${
                step === 3 ? "text-brand" : "text-appSubtext"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs text-white ${
                  step === 3 ? "bg-brand" : "bg-appBorder"
                }`}
              >
                3
              </span>
              تم الإنشاء
            </div>
          </div>
        </div>

        {/* Modal Content Steps */}
        <div className="max-h-[65vh] overflow-y-auto p-6">
          {/* STEP 1: FILE UPLOAD */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-appText">عقد التأسيس</h3>
                <p className="text-xs text-appSubtext mt-0.5">
                  سيتم إرسال ملف PDF إلى خدمة OCR لاستخراج بيانات الشركة والعقد
                </p>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-appBorder bg-appMuted/30 p-6 text-center hover:border-brand/50 transition-colors"
              >
                <UploadCloud className="h-10 w-10 text-brand mb-2" />
                <p className="text-sm font-bold text-appText">
                  اسحب عقد التأسيس هنا أو اضغط للاختيار
                </p>
                <p className="mt-1 text-xs text-appSubtext">ملف PDF فقط</p>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload-input"
                />
                <label
                  htmlFor="pdf-upload-input"
                  className="mt-4 inline-flex cursor-pointer rounded-lg border border-appBorder bg-appSurface px-4 py-2 text-xs font-bold text-appText hover:bg-appMuted shadow-xs"
                >
                  اختر ملف PDF
                </label>

                {file && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-brand/10 border border-brand/20 px-3 py-1.5 text-xs text-brand font-medium">
                    <FileText className="h-4 w-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW DATA */}
          {step === 2 && extractedData && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-appText">مراجعة البيانات المستخرجة</h3>
                <p className="text-xs text-appSubtext mt-0.5">
                  تأكد من البيانات قبل إنشاء الشركة وحفظ عقد التأسيس.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="col-span-1 rounded-lg border border-appBorder bg-appMuted/30 p-3">
                  <span className="text-[11px] text-appSubtext block">اسم الشركة</span>
                  <input
                    type="text"
                    value={extractedData.company_name}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, company_name: e.target.value })
                    }
                    className="w-full bg-transparent text-sm font-bold text-appText outline-none mt-1"
                  />
                </div>

                <div className="col-span-1 rounded-lg border border-appBorder bg-appMuted/30 p-3">
                  <span className="text-[11px] text-appSubtext block">نوع الشركة</span>
                  <input
                    type="text"
                    value={extractedData.company_type}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, company_type: e.target.value })
                    }
                    className="w-full bg-transparent text-sm font-bold text-appText outline-none mt-1"
                  />
                </div>

                <div className="col-span-2 rounded-lg border border-appBorder bg-appMuted/30 p-3">
                  <span className="text-[11px] text-appSubtext block">عنوان الشركة</span>
                  <input
                    type="text"
                    value={extractedData.company_address}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, company_address: e.target.value })
                    }
                    className="w-full bg-transparent text-sm font-bold text-appText outline-none mt-1"
                  />
                </div>

                <div className="col-span-1 rounded-lg border border-appBorder bg-appMuted/30 p-3">
                  <span className="text-[11px] text-appSubtext block">رأس المال</span>
                  <input
                    type="text"
                    value={extractedData.company_capital}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, company_capital: e.target.value })
                    }
                    className="w-full bg-transparent text-sm font-bold text-appText outline-none mt-1"
                  />
                </div>

                <div className="col-span-1 rounded-lg border border-appBorder bg-appMuted/30 p-3">
                  <span className="text-[11px] text-appSubtext block">رقم السجل التجاري</span>
                  <input
                    type="text"
                    value={extractedData.commercial_register_number}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        commercial_register_number: e.target.value,
                      })
                    }
                    className="w-full bg-transparent text-sm font-bold text-appText outline-none mt-1"
                  />
                </div>

                <div className="col-span-1 rounded-lg border border-appBorder bg-appMuted/30 p-3">
                  <span className="text-[11px] text-appSubtext block">تاريخ الموافقة</span>
                  <input
                    type="text"
                    value={extractedData.approval_date}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, approval_date: e.target.value })
                    }
                    className="w-full bg-transparent text-sm font-bold text-appText outline-none mt-1"
                  />
                </div>

                <div className="col-span-1 rounded-lg border border-appBorder bg-appMuted/30 p-3">
                  <span className="text-[11px] text-appSubtext block">مدة الشركة</span>
                  <input
                    type="text"
                    value={extractedData.company_duration}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, company_duration: e.target.value })
                    }
                    className="w-full bg-transparent text-sm font-bold text-appText outline-none mt-1"
                  />
                </div>

                <div className="col-span-2 rounded-lg border border-appBorder bg-appMuted/30 p-3">
                  <span className="text-[11px] text-appSubtext block">النشاط</span>
                  <textarea
                    rows={2}
                    value={extractedData.company_activity}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, company_activity: e.target.value })
                    }
                    className="w-full bg-transparent text-xs font-medium text-appText outline-none mt-1 resize-none"
                  />
                </div>

                {/* Articles */}
                <div className="col-span-2 space-y-2 mt-2">
                  <span className="text-xs font-bold text-appText">بنود العقد</span>
                  {extractedData.articles?.map((article, idx) => (
                    <div
                      key={article.id || idx}
                      className="rounded-lg border border-appBorder bg-appMuted/20 p-3"
                    >
                      <textarea
                        rows={3}
                        value={article.value}
                        onChange={(e) => {
                          const updatedArticles = [...extractedData.articles];
                          updatedArticles[idx].value = e.target.value;
                          setExtractedData({ ...extractedData, articles: updatedArticles });
                        }}
                        className="w-full bg-transparent text-xs text-appSubtext leading-relaxed outline-none resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-appText">تم إنشاء الشركة بنجاح!</h3>
              <p className="mt-1 text-sm text-appSubtext max-w-md">
                تم استخراج البيانات، وحفظ شركة جديدة وإدراج عقد التأسيس في النظام بنجاح.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-appBorder p-4 bg-appMuted/20">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="rounded-lg border border-appBorder px-4 py-2 text-xs font-bold text-appText hover:bg-appMuted"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!file || isExtracting}
                onClick={handleExtractData}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-white disabled:opacity-50 hover:bg-brandDeep transition-colors"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري استخراج البيانات...
                  </>
                ) : (
                  "استخراج البيانات"
                )}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-appBorder px-4 py-2 text-xs font-bold text-appText hover:bg-appMuted"
              >
                رجوع
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateCompany}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-xs font-bold text-white hover:bg-brandDeep transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الإنشاء...
                  </>
                ) : (
                  "إنشاء الشركة"
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mr-auto rounded-lg bg-brand px-6 py-2 text-xs font-bold text-white hover:bg-brandDeep"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}