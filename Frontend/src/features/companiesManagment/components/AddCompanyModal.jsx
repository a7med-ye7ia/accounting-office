import { useState, useEffect, useRef } from "react";
import { uploadPdfForOcr, createCompanyFromOcr } from "../../../api/companies";

/**
 * AddCompanyModal — 3-step flow for creating a company from a PDF:
 *   Step 1: Upload PDF → sends to Fake OCR API
 *   Step 2: Review extracted data
 *   Step 3: Create company → success confirmation
 */
export default function AddCompanyModal({ onClose, onCompanyCreated }) {
  const [step, setStep] = useState(1); // 1=upload, 2=review, 3=success
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ocrData, setOcrData] = useState(null);
  const [createdCompany, setCreatedCompany] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // ---- File handling ----
  const validateAndSetFile = (selected) => {
    if (!selected) return;
    if (selected.type === "application/pdf") {
      setFile(selected);
      setError("");
    } else {
      setError("يرجى اختيار ملف PDF فقط");
      setFile(null);
    }
  };

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  // ---- Step 1 → Step 2: Upload to OCR ----
  const handleUploadToOcr = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const data = await uploadPdfForOcr(file);
      setOcrData(data);
      setStep(2);
    } catch (err) {
      setError("فشل في استخراج البيانات من الملف. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Step 2 → Step 3: Create company ----
const handleCreateCompany = async () => {
  if (!ocrData || !file) return;

  setLoading(true);
  setError("");

  try {
    const companyRequest = {
      company_name: ocrData.company_name,
      company_type: ocrData.company_type,
      company_address: ocrData.company_address,
      company_capital: ocrData.company_capital,
      commercial_register_number: ocrData.commercial_register_number,
      approval_date: ocrData.approval_date,
      company_duration: ocrData.company_duration,
      company_activity: ocrData.company_activity,
    };

    const company = await createCompanyFromOcr(
      companyRequest,
      file,
      ocrData
    );

    setCreatedCompany(company);
    setStep(3);

    if (onCompanyCreated) {
      onCompanyCreated();
    }
  } catch (err) {
    setError("فشل في إنشاء الشركة. حاول مرة أخرى.");
  } finally {
    setLoading(false);
  }
};

  // ---- Step indicators ----
  const steps = [
    { num: 1, label: "رفع الملف" },
    { num: 2, label: "مراجعة البيانات" },
    { num: 3, label: "تم الإنشاء" },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4
                  transition-all duration-300
                  ${isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col
                    overflow-hidden transition-all duration-300
                    ${isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"}`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-600 to-indigo-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg">إضافة شركة جديدة</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 cursor-pointer transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                      ${step === s.num
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : step > s.num
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                  >
                    {step > s.num ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors duration-300 hidden sm:inline
                      ${step === s.num ? "text-indigo-700" : step > s.num ? "text-emerald-600" : "text-slate-400"}`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 rounded-full transition-colors duration-300
                      ${step > s.num ? "bg-emerald-400" : "bg-slate-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 1 && (
            <div className="animate-fadeIn space-y-5">
              <div className="text-center mb-2">
                <h4 className="text-lg font-bold text-slate-800 mb-1">رفع عقد التأسيس</h4>
                <p className="text-sm text-slate-500">ارفع ملف PDF لعقد تأسيس الشركة لاستخراج البيانات تلقائياً</p>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer
                  ${error
                    ? "border-red-400 bg-red-50"
                    : dragOver
                      ? "border-indigo-400 bg-indigo-50 scale-[1.02]"
                      : file
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="animate-fadeIn">
                    <div className="w-14 h-14 mx-auto mb-3 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="font-semibold text-emerald-700 text-sm truncate px-4">{file.name}</p>
                    <p className="text-xs text-emerald-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="mt-3 text-xs text-red-500 hover:text-red-700 underline cursor-pointer"
                    >
                      إزالة الملف
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-600">اسحب ملف PDF هنا أو اضغط للاختيار</p>
                    <p className="text-xs text-slate-400 mt-1">عقد تأسيس الشركة فقط (PDF)</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && ocrData && (
            <div className="animate-fadeIn space-y-5">
              <div className="text-center mb-2">
                <h4 className="text-lg font-bold text-slate-800 mb-1">مراجعة البيانات المستخرجة</h4>
                <p className="text-sm text-slate-500">تم استخراج البيانات التالية من العقد — راجعها قبل إنشاء الشركة</p>
              </div>

              <div className="space-y-4">
                {/* Main Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ReviewField label="اسم الشركة" value={ocrData.company_name} accent="indigo" />
                  <ReviewField label="نوع الشركة" value={ocrData.company_type} accent="purple" />
                  <ReviewField label="عنوان الشركة" value={ocrData.company_address} full />
                  <ReviewField label="رأس المال" value={ocrData.company_capital} accent="emerald" />
                  <ReviewField label="رقم السجل التجاري" value={ocrData.commercial_register_number} />
                  <ReviewField label="تاريخ الموافقة" value={ocrData.approval_date} />
                  <ReviewField label="مدة الشركة" value={ocrData.company_duration} />
                  <ReviewField label="النشاط" value={ocrData.company_activity} full />
                </div>

                {/* Law Reference */}
                {ocrData.law_reference && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">المرجع القانوني</h5>
                    <div className="flex gap-4">
                      <span className="text-sm text-slate-700">
                        <span className="text-slate-400 ml-1">القانون رقم:</span>
                        {ocrData.law_reference.law_number}
                      </span>
                      <span className="text-sm text-slate-700">
                        <span className="text-slate-400 ml-1">لسنة:</span>
                        {ocrData.law_reference.law_year}
                      </span>
                    </div>
                  </div>
                )}

                {/* Articles */}
                {ocrData.articles && ocrData.articles.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      مواد العقد ({ocrData.articles.length})
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {ocrData.articles.map((article, idx) => (
                        <div key={article.id || idx} className="bg-white rounded-lg border border-slate-200 p-3">
                          <div className="flex items-start gap-2">
                            <span className="shrink-0 w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                              {article.id || idx + 1}
                            </span>
                            <p className="text-sm text-slate-700 leading-relaxed">{article.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="animate-fadeIn text-center py-8">
              <div className="w-20 h-20 mx-auto mb-5 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-slate-800 mb-2">تم إنشاء الشركة بنجاح!</h4>
              <p className="text-sm text-slate-500 mb-1">
                {createdCompany?.name || ocrData?.company_name || "الشركة"}
              </p>
              <p className="text-xs text-slate-400">
                تم حفظ بيانات العقد والشركة في قاعدة البيانات
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end shrink-0">
          {step === 1 && (
            <>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleUploadToOcr}
                disabled={!file || loading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-l from-emerald-600 to-indigo-700
                           disabled:bg-none disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer
                           enabled:hover:shadow-xl enabled:hover:shadow-indigo-300 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جارٍ الاستخراج...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    استخراج البيانات
                  </>
                )}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => { setStep(1); setError(""); }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer transition-all"
              >
                رجوع
              </button>
              <button
                onClick={handleCreateCompany}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-l from-emerald-600 to-indigo-700
                           disabled:bg-none disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer
                           enabled:hover:shadow-xl enabled:hover:shadow-indigo-300 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جارٍ الإنشاء...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    إنشاء الشركة
                  </>
                )}
              </button>
            </>
          )}

          {step === 3 && (
            <button
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-l from-emerald-600 to-indigo-700
                         hover:shadow-xl hover:shadow-indigo-300 transition-all duration-200 cursor-pointer"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Helper: read-only field for the review step */
function ReviewField({ label, value, accent = "slate", full = false }) {
  if (!value) return null;

  const accentMap = {
    indigo: "border-indigo-200 bg-indigo-50/50",
    purple: "border-purple-200 bg-purple-50/50",
    emerald: "border-emerald-200 bg-emerald-50/50",
    slate: "border-slate-200 bg-white",
  };

  return (
    <div className={`rounded-xl border p-3 ${accentMap[accent] || accentMap.slate} ${full ? "sm:col-span-2" : ""}`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-800 leading-relaxed">{value}</p>
    </div>
  );
}
