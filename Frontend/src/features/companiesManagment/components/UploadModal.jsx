import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MODAL_LAYER_CLASS } from "../../../shared/components/HrShared.jsx";

export default function UploadModal({
  onClose,
  onUpload,
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
  const fileInputRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    if (initialType) {
      setType(initialType);
      setError("");
    } else if (!uploadZoneOnly) {
      setType(null);
    }
  }, [initialType, uploadZoneOnly]);

  useEffect(() => {
    if (!initialType || uploadZoneOnly) return;

    const timer = setTimeout(() => {
      fileInputRef.current?.click();
    }, 250);

    return () => clearTimeout(timer);
  }, [initialType, uploadZoneOnly]);

  useEffect(() => {
    setError("");
  }, [file, type]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    if (!type) {
      setError("يرجى اختيار نوع العقد أولاً");
      return;
    }

    const dropped = e.dataTransfer.files?.[0];
    validateAndSetFile(dropped);
  };

  const validateAndSetFile = (selected) => {
    if (selected) {
      if (selected.type === "application/pdf") {
        setFile(selected);
        setError("");
      } else {
        setError("يرجى اختيار ملف PDF فقط");
        setFile(null);
      }
    }
  };

  const handleUpload = () => {
    if (!file || !type) return;

    onUpload({
      id: `file-${Date.now()}`,
      name: file.name,
      type,
      size: (file.size / 1024).toFixed(1) + " KB",
      date: new Date().toLocaleDateString("ar-SA"),
      file,
    });

    handleClose();
  };

  const typeLabel =
    type === "establishment"
      ? "عقود تأسيس"
      : type === "amendment"
        ? "عقود تعديل"
        : type === "other"
          ? "عقود وملفات أخرى"
          : "";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4
                  transition-all duration-300
                  ${isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"}`}
      onClick={handleClose}
      role="presentation"
    >
      <div
        className={`relative isolate w-full max-w-lg overflow-hidden rounded-2xl border border-appBorder bg-appSurface shadow-panel ui-transition ${
          isVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="bg-gradient-to-l from-brand to-brandDeep px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-appSurface/20 rounded-xl flex items-center justify-center border border-appSurface/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg">رفع عقد جديد</h3>
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

        <div className="p-6 space-y-6">
          {!uploadZoneOnly && !initialType ? (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                اختر نوع العقد
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setType("establishment");
                    setFile(null);
                    setError("");
                  }}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer
                    ${type === "establishment"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"}`}
                >
                  <div className="text-2xl mb-1">📋</div>
                  <div className="text-sm font-medium">عقود تأسيس</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("amendment");
                    setFile(null);
                    setError("");
                  }}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer
                    ${type === "amendment"
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"}`}
                >
                  <div className="text-2xl mb-1">📝</div>
                  <div className="text-sm font-medium">عقود تعديل</div>
                </button>
              </div>
            </div>
          ) : !uploadZoneOnly && initialType ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500 mb-1">نوع العقد المحدد</p>
              <p
                className={`text-sm font-bold ${
                  type === "establishment"
                    ? "text-indigo-700"
                    : type === "amendment"
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}
              >
                {typeLabel}
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              ارفع الملف
            </label>
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
                        ${error
                  ? "border-red-400 bg-red-50"
                  : dragOver
                    ? "border-indigo-400 bg-indigo-50"
                    : file
                      ? "border-green-400 bg-green-50"
                      : type === "establishment"
                        ? "border-slate-300 bg-slate-50 hover:border-indigo-500"
                        : type === "amendment"
                          ? "border-slate-300 bg-slate-50 hover:border-amber-500"
                          : type === "other"
                            ? "border-slate-300 bg-slate-50 hover:border-emerald-500"
                            : "border-slate-300 bg-slate-50 hover:border-green-500"
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                if (type) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() =>
                type
                  ? fileInputRef.current?.click()
                  : setError("يرجى اختيار نوع العقد أولاً")
              }
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
                  <div className="w-12 h-12 mx-auto mb-3 bg-success/15 rounded-xl flex items-center justify-center border border-appBorder">
                    <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-green-700 text-sm truncate px-4">
                    {file.name}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setType(
                        uploadZoneOnly && initialType
                          ? initialType
                          : initialType || null
                      );
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 underline cursor-pointer"
                  >
                    إزالة الملف
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-12 h-12 mx-auto mb-3 bg-appMuted rounded-xl flex items-center justify-center border border-appBorder">
                    <svg className="w-6 h-6 text-appSubtext" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    اسحب ملف الـ PDF هنا أو اضغط للاختيار
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-shake">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || !type}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand hover:bg-brandDeep disabled:opacity-40 disabled:cursor-not-allowed ui-transition shadow-panel"
          >
            رفع العقد
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
