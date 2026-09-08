import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { createCompanyFromOcr, uploadPdfForOcr } from "../../../api/companies";
import { fetchBranches } from "../../../api/branches";
import { fetchDepartments } from "../../../api/departments";
import { getCanonicalRole, ROLES } from "../../../utils/roles";

const STEPS = [
  { number: 1, label: "رفع الملف" },
  { number: 2, label: "مراجعة البيانات" },
  { number: 3, label: "تم الإنشاء" },
];

function ReviewField({ label, value, full = false }) {
  if (!value) return null;

  return (
    <div className={`rounded-lg border border-appBorder bg-appMuted p-3 ${full ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-semibold text-appSubtext">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-appText">{value}</p>
    </div>
  );
}

function StepIndicator({ step }) {
  return (
    <div className="border-b border-appBorder bg-appMuted px-5 py-4">
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((item, index) => (
          <div key={item.number} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ui-transition ${
                  step === item.number
                    ? "bg-brand text-white"
                    : step > item.number
                      ? "bg-success text-white"
                      : "bg-appSurface text-appSubtext border border-appBorder"
                }`}
              >
                {step > item.number ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : item.number}
              </div>
              <span className={`hidden text-xs font-bold sm:inline ${step >= item.number ? "text-appText" : "text-appSubtext"}`}>
                {item.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className={`h-px w-8 ${step > item.number ? "bg-success" : "bg-appBorder"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildCompanyRequest(ocrData, branchId, departmentId) {
  return {
    company_name: ocrData.company_name,
    company_type: ocrData.company_type,
    company_address: ocrData.company_address,
    company_capital: ocrData.company_capital,
    commercial_register_number: new Date().toLocaleString,
    approval_date: ocrData.approval_date,
    company_duration: ocrData.company_duration,
    company_activity: ocrData.company_activity,
    branch_id: branchId ? parseInt(branchId, 10) : null,
    department_id: departmentId ? parseInt(departmentId, 10) : null,
  };
}

export default function AddCompanyModal({ onClose, onCompanyCreated }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ocrData, setOcrData] = useState(null);
  const [createdCompany, setCreatedCompany] = useState(null);
  const fileInputRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);
  const userRole = getCanonicalRole(currentUser);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    // Load branches & departments
    Promise.all([
      fetchBranches().catch(() => []),
      fetchDepartments().catch(() => [])
    ]).then(([bList, dList]) => {
      setBranches(bList || []);
      setDepartments(dList || []);

      if (userRole === ROLES.BRANCH_MANAGER && currentUser?.branchId) {
        setSelectedBranchId(String(currentUser.branchId));
      } else if (userRole === ROLES.DEPARTMENT_MANAGER && currentUser?.branchId) {
        setSelectedBranchId(String(currentUser.branchId));
        if (currentUser?.managedDepartmentIds?.length === 1) {
          setSelectedDepartmentId(String(currentUser.managedDepartmentIds[0]));
        }
      }
    });
  }, [userRole, currentUser]);

  const availableDepartments = useMemo(() => {
    if (!selectedBranchId) return [];
    let list = departments.filter((d) => d.branch && String(d.branch.id) === String(selectedBranchId));
    if (userRole === ROLES.DEPARTMENT_MANAGER && currentUser?.managedDepartmentIds?.length) {
      list = list.filter((d) => currentUser.managedDepartmentIds.includes(d.id));
    }
    return list;
  }, [departments, selectedBranchId, userRole, currentUser]);

  const handleClose = () => {
    if (loading) return;
    setIsVisible(false);
    setTimeout(onClose, 220);
  };

  const validateAndSetFile = (selected) => {
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      setError("يرجى اختيار ملف PDF فقط");
      setFile(null);
      return;
    }

    setFile(selected);
    setError("");
  };

  const handleUploadToOcr = async () => {
    if (!file || loading) return;

    setLoading(true);
    setError("");

    try {
      const data = await uploadPdfForOcr(file);
      setOcrData(data);
      setStep(2);
    } catch (uploadError) {
      console.error(uploadError);
      setError("فشل استخراج البيانات من الملف. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!ocrData || !file || loading) return;

    if (!selectedBranchId || !selectedDepartmentId) {
      setError("يرجى تحديد الفرع والقسم التابع لهما الشركة قبل المتابعة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const req = buildCompanyRequest(ocrData, selectedBranchId, selectedDepartmentId);
      const company = await createCompanyFromOcr(req, file, ocrData);
      setCreatedCompany(company);
      setStep(3);
      onCompanyCreated?.();
    } catch (createError) {
      console.error(createError);
      setError(createError.response?.data?.error || "فشل إنشاء الشركة. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? "bg-appText/45 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={handleClose}
    >
      <div
        className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-appBorder bg-appSurface shadow-raise transition-all duration-200 ${
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-3"
        }`}
        onClick={(event) => event.stopPropagation()}
        dir="rtl"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 border-b border-appBorder p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-appText">إضافة شركة جديدة</h3>
              <p className="mt-1 text-sm leading-6 text-appSubtext">
                ارفع عقد التأسيس، راجع البيانات المستخرجة، ثم أنشئ الشركة بنفس بيانات backend الحالية.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-appBorder bg-appMuted text-appSubtext ui-transition hover:text-appText"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <StepIndicator step={step} />

        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-bold text-appText">عقد التأسيس</h4>
                <p className="mt-1 text-sm text-appSubtext">
                  سيتم إرسال ملف PDF إلى خدمة OCR لاستخراج بيانات الشركة والعقد.
                </p>
              </div>

              <button
                type="button"
                className={`w-full rounded-lg border-2 border-dashed p-10 text-center ui-transition ${
                  error
                    ? "border-danger/50 bg-danger/10"
                    : dragOver
                      ? "border-brand bg-brand/10"
                      : file
                        ? "border-success/50 bg-success/10"
                        : "border-appBorder bg-appMuted hover:border-brand/50 hover:bg-brand/5"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  validateAndSetFile(event.dataTransfer.files?.[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(event) => validateAndSetFile(event.target.files?.[0])}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle2 className="h-11 w-11 text-success" aria-hidden="true" />
                    <p className="mt-3 max-w-full truncate text-sm font-bold text-appText">{file.name}</p>
                    <p className="mt-1 text-xs text-appSubtext">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-11 w-11 text-appSubtext" aria-hidden="true" />
                    <p className="mt-3 text-sm font-bold text-appText">اسحب عقد التأسيس هنا أو اضغط للاختيار</p>
                    <p className="mt-1 text-xs text-appSubtext">ملف PDF فقط</p>
                  </div>
                )}
              </button>
            </div>
          )}

          {step === 2 && ocrData && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-bold text-appText">مراجعة البيانات وتحديد النطاق</h4>
                <p className="mt-1 text-sm text-appSubtext">
                  تأكد من البيانات وحدد الفرع والقسم التابع لهما الشركة قبل الحفظ.
                </p>
              </div>

              {/* Branch and Department Assignment */}
              <div className="rounded-lg border border-appBorder bg-appSurface p-4 space-y-3">
                <h5 className="text-sm font-bold text-appText">تحديد الفرع والقسم التابع لهما الشركة *</h5>
                <p className="text-xs text-appSubtext">يجب ربط الشركة بفرع وقسم متطابقين وفقاً لصلاحيات دورك.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold text-appSubtext mb-1.5">الفرع *</label>
                    <select
                      disabled={userRole === ROLES.BRANCH_MANAGER || userRole === ROLES.DEPARTMENT_MANAGER}
                      value={selectedBranchId}
                      onChange={(e) => {
                        setSelectedBranchId(e.target.value);
                        setSelectedDepartmentId("");
                      }}
                      className="w-full rounded-lg border border-appBorder bg-appMuted p-2.5 text-sm text-appText outline-none focus:border-brand"
                    >
                      <option value="">اختر الفرع</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-appSubtext mb-1.5">القسم *</label>
                    <select
                      disabled={!selectedBranchId}
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full rounded-lg border border-appBorder bg-appMuted p-2.5 text-sm text-appText outline-none focus:border-brand"
                    >
                      <option value="">اختر القسم</option>
                      {availableDepartments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ReviewField label="اسم الشركة" value={ocrData.company_name} />
                <ReviewField label="نوع الشركة" value={ocrData.company_type} />
                <ReviewField label="عنوان الشركة" value={ocrData.company_address} full />
                <ReviewField label="رأس المال" value={ocrData.company_capital} />
                <ReviewField label="رقم السجل التجاري" value={ocrData.commercial_register_number} />
                <ReviewField label="تاريخ الموافقة" value={ocrData.approval_date} />
                <ReviewField label="مدة الشركة" value={ocrData.company_duration} />
                <ReviewField label="النشاط" value={ocrData.company_activity} full />
              </div>

              {ocrData.articles?.length > 0 && (
                <section className="rounded-lg border border-appBorder bg-appSurface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="text-sm font-bold text-appText">مواد العقد</h5>
                    <span className="rounded-lg border border-appBorder bg-appMuted px-2.5 py-1 text-xs font-bold text-appSubtext">
                      {ocrData.articles.length}
                    </span>
                  </div>
                  <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                    {ocrData.articles.map((article, index) => (
                      <div key={article.id || index} className="rounded-lg border border-appBorder bg-appMuted p-3">
                        <p className="text-xs font-bold text-brand">المادة {article.id || index + 1}</p>
                        <p className="mt-1 text-sm leading-6 text-appText">{article.value}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg border border-success/20 bg-success/10 text-success">
                <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
              </div>
              <h4 className="mt-4 text-xl font-bold text-appText">تم إنشاء الشركة بنجاح</h4>
              <p className="mt-2 text-sm text-appSubtext">
                {createdCompany?.name || ocrData?.company_name || "الشركة"}
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-bold text-danger">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-appBorder bg-appMuted p-4 sm:flex-row sm:justify-end">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-appBorder bg-appSurface px-4 text-sm font-bold text-appText ui-transition hover:bg-appMuted disabled:cursor-not-allowed disabled:opacity-60"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleUploadToOcr}
                disabled={!file || loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-white ui-transition hover:bg-brandDeep disabled:cursor-not-allowed disabled:bg-appBorder"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                {loading ? "جاري الاستخراج..." : "استخراج البيانات"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-appBorder bg-appSurface px-4 text-sm font-bold text-appText ui-transition hover:bg-appMuted disabled:cursor-not-allowed disabled:opacity-60"
              >
                رجوع
              </button>
              <button
                type="button"
                onClick={handleCreateCompany}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-white ui-transition hover:bg-brandDeep disabled:cursor-not-allowed disabled:bg-appBorder"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Building2 className="h-4 w-4" aria-hidden="true" />}
                {loading ? "جاري الإنشاء..." : "إنشاء الشركة"}
              </button>
            </>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-brand px-5 text-sm font-bold text-white ui-transition hover:bg-brandDeep"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
