import { useState, useEffect, useRef } from "react";

export default function UploadModal({ onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [type, setType] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    setError("");
  }, [file, type]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    validateAndSetFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);

    if (!type) {
      setError("يرجى اختيار نوع العقد أولاً");
      return;
    }

    const dropped = e.dataTransfer.files[0];
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

  const dropClass = error
    ? "border-danger bg-badgeRedBg"
    : dragOver
      ? "border-brand bg-badgeBlueBg"
      : file
        ? "border-success bg-success/10"
        : type === "establishment"
          ? "border-appBorder bg-appMuted hover:border-brand"
          : type === "amendment"
            ? "border-appBorder bg-appMuted hover:border-badgePurpleText"
            : "border-appBorder bg-appMuted hover:border-brand/40";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ui-transition ${
        isVisible ? "bg-appText/40 backdrop-blur-sm" : "bg-transparent pointer-events-none"
      }`}
      onClick={handleClose}
    >
      <div
        className={`rounded-2xl border border-appBorder bg-appSurface shadow-panel w-full max-w-lg overflow-hidden ui-transition ${
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
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
            type="button"
            onClick={handleClose}
            className="text-white/90 hover:text-white hover:bg-appSurface/20 rounded-xl p-2 cursor-pointer ui-transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-appText mb-3">اختر نوع العقد</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType("establishment");
                  setFile(null);
                  setError("");
                }}
                className={`p-4 rounded-2xl border-2 text-center ui-transition cursor-pointer ${
                  type === "establishment"
                    ? "border-brand bg-badgeBlueBg text-badgeBlueText"
                    : "border-appBorder bg-appSurface text-appSubtext hover:border-brand/40"
                }`}
              >
                <div className="text-2xl mb-1">📋</div>
                <div className="text-sm font-medium text-appText">عقود تأسيس</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("amendment");
                  setFile(null);
                  setError("");
                }}
                className={`p-4 rounded-2xl border-2 text-center ui-transition cursor-pointer ${
                  type === "amendment"
                    ? "border-badgePurpleText bg-badgePurpleBg text-badgePurpleText"
                    : "border-appBorder bg-appSurface text-appSubtext hover:border-badgePurpleText/50"
                }`}
              >
                <div className="text-2xl mb-1">📝</div>
                <div className="text-sm font-medium text-appText">عقود تعديل</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-appText mb-3">ارفع الملف</label>
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center ui-transition ${dropClass}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (type) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() =>
                type ? fileInputRef.current?.click() : setError("يرجى اختيار نوع العقد أولاً")
              }
            >
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />

              {file ? (
                <div className="animate-fadeIn">
                  <div className="w-12 h-12 mx-auto mb-3 bg-success/15 rounded-xl flex items-center justify-center border border-appBorder">
                    <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-semibold text-appText text-sm truncate px-4">{file.name}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setType(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-2 text-xs text-danger hover:text-danger/80 underline cursor-pointer ui-transition"
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
                  <p className="text-sm font-medium text-appText">اسحب ملف الـ PDF هنا أو اضغط للاختيار</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-danger bg-badgeRedBg p-3 rounded-xl border border-appBorder animate-shake">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
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

        <div className="px-6 py-4 bg-appMuted/50 border-t border-appBorder flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-appText bg-appSurface border border-appBorder hover:bg-appMuted cursor-pointer ui-transition"
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
    </div>
  );
}
