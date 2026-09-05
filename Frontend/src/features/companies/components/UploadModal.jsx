import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FilePenLine, FileText, FolderOpen, Upload, X, XCircle } from "lucide-react";
import { uploadContract } from "../../../api/contracts";
import { getContractTypeMeta } from "../services/companyWorkflow";

const TYPE_OPTIONS = [
  {
    key: "establishment",
    icon: FileText,
    description: "عقد تأسيس أو مستند أصلي للشركة.",
  },
  {
    key: "amendment",
    icon: FilePenLine,
    description: "عقد تعديل أو تحديث على بيانات الشركة.",
  },
];

function formatFileSize(size) {
  return `${(size / 1024).toFixed(1)} KB`;
}

function TypeChoice({ option, selected, onClick }) {
  const meta = getContractTypeMeta(option.key);
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-right ui-transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
        selected
          ? "border-brand bg-brand/10 text-brand"
          : "border-appBorder bg-appSurface text-appText hover:border-brand/40 hover:bg-appMuted"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
          selected ? "border-brand/20 bg-brand/10" : "border-appBorder bg-appMuted"
        }`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-bold">{meta.label}</p>
          <p className="mt-1 text-xs leading-5 text-appSubtext">{option.description}</p>
        </div>
      </div>
    </button>
  );
}

export default function UploadModal({
  onClose,
  onUpload,
  companyId,
  initialType = null,
  uploadZoneOnly = false,
}) {
  const [file, setFile] = useState(null);
  const [type, setType] = useState(() =>
    uploadZoneOnly && initialType ? initialType : initialType || null
  );
  const [dragOver, setDragOver] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    if (!initialType || uploadZoneOnly) return;

    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 250);

    return () => clearTimeout(timer);
  }, [initialType, uploadZoneOnly]);

  const handleClose = () => {
    if (uploading) return;
    setIsVisible(false);
    setTimeout(onClose, 220);
  };

  const selectType = (nextType) => {
    setType(nextType);
    setFile(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  const handleFileChange = (event) => {
    validateAndSetFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);

    if (!type) {
      setError("يرجى اختيار نوع العقد أولاً");
      return;
    }

    validateAndSetFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file || !type || uploading) return;

    setUploading(true);
    setError("");

    try {
      const savedContract = await uploadContract({ companyId, type, file });

      onUpload({
        ...savedContract,
        name: file.name,
        type,
        size: formatFileSize(file.size),
      });

      handleClose();
    } catch (uploadError) {
      console.error(uploadError);
      setError("فشل رفع الملف. حاول مرة أخرى.");
    } finally {
      setUploading(false);
    }
  };

  const selectedMeta = type ? getContractTypeMeta(type) : null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isVisible ? "bg-appText/45 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-xl overflow-hidden rounded-lg border border-appBorder bg-appSurface shadow-raise transition-all duration-200 ${
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
              <Upload className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-appText">رفع مستند للشركة</h3>
              <p className="mt-1 text-sm leading-6 text-appSubtext">
                اختر نوع المستند ثم ارفع ملف PDF ليتم حفظه في ملف الشركة الحالي.
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

        <div className="space-y-5 p-5">
          {!uploadZoneOnly && !initialType ? (
            <section>
              <h4 className="text-sm font-bold text-appText">نوع المستند</h4>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {TYPE_OPTIONS.map((option) => (
                  <TypeChoice
                    key={option.key}
                    option={option}
                    selected={type === option.key}
                    onClick={() => selectType(option.key)}
                  />
                ))}
              </div>
            </section>
          ) : selectedMeta ? (
            <section className="rounded-lg border border-appBorder bg-appMuted p-4">
              <p className="text-xs font-semibold text-appSubtext">نوع المستند المحدد</p>
              <p className="mt-1 text-sm font-bold text-appText">{selectedMeta.label}</p>
            </section>
          ) : null}

          <section>
            <h4 className="text-sm font-bold text-appText">ملف PDF</h4>
            <button
              type="button"
              className={`mt-3 w-full rounded-lg border-2 border-dashed p-8 text-center ui-transition ${
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
                if (type) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() =>
                type ? fileInputRef.current?.click() : setError("يرجى اختيار نوع العقد أولاً")
              }
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {error ? (
                <div className="flex flex-col items-center">
                  <XCircle className="h-10 w-10 text-danger" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold text-danger">حدث خطأ</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center">
                  <CheckCircle2 className="h-10 w-10 text-success" aria-hidden="true" />
                  <p className="mt-3 max-w-full truncate text-sm font-bold text-appText">{file.name}</p>
                  <p className="mt-1 text-xs text-appSubtext">{formatFileSize(file.size)}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <FolderOpen className="h-10 w-10 text-appSubtext" aria-hidden="true" />
                  <p className="mt-3 text-sm font-bold text-appText">اسحب ملف PDF هنا أو اضغط للاختيار</p>
                  <p className="mt-1 text-xs text-appSubtext">يجب تحديد نوع المستند قبل الرفع.</p>
                </div>
              )}
            </button>

            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-2 text-xs font-bold text-danger hover:underline"
              >
                إزالة الملف
              </button>
            )}

            {error && (
              <div className="mt-3 rounded-lg border border-danger/20 bg-danger/10 p-3 text-xs font-bold text-danger">
                {error}
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-appBorder bg-appMuted p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-appBorder bg-appSurface px-4 text-sm font-bold text-appText ui-transition hover:bg-appMuted disabled:cursor-not-allowed disabled:opacity-60"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || !type || uploading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-bold text-white ui-transition hover:bg-brandDeep disabled:cursor-not-allowed disabled:bg-appBorder"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {uploading ? "جاري الرفع..." : "رفع المستند"}
          </button>
        </div>
      </div>
    </div>
  );
}



