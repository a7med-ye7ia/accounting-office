import { useState, useEffect } from "react";

export default function DeleteToast({ contract, onUndo, onExpire }) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsVisible(false);
      setTimeout(() => onExpire(contract.id), 300);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, contract.id, onExpire]);

  const handleUndo = () => {
    setIsVisible(false);
    setTimeout(() => onUndo(contract), 300);
  };

  const undoClass =
    contract.type === "establishment"
      ? "bg-brand hover:bg-brandDeep"
      : "bg-badgePurpleText hover:bg-brandDeep";

  const barClass =
    contract.type === "establishment" ? "bg-gradient-to-l from-brand to-brandDeep" : "bg-gradient-to-l from-badgePurpleText to-brand";

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ui-transition ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      dir="rtl"
    >
      <div className="bg-appSurface text-appText rounded-2xl border border-appBorder shadow-panel px-6 py-4 min-w-[380px] max-w-[calc(100vw-2rem)]">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-badgeRedBg rounded-lg flex items-center justify-center flex-shrink-0 border border-appBorder">
              <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-appText">تم حذف العقد بنجاح</p>
              <p className="text-xs text-appSubtext mt-0.5 truncate max-w-[200px]">"{contract.name}"</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUndo}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium ui-transition hover:scale-105 cursor-pointer shadow-panel ${undoClass}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            تراجع
          </button>
        </div>

        <div className="w-full h-1 bg-appBorder rounded-full overflow-hidden">
          <div className={`h-full rounded-full animate-shrink ${barClass}`} />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-appSubtext">سيتم الحذف نهائياً خلال</span>
          <span className="text-[10px] text-appSubtext font-mono tabular-nums">{timeLeft} ثوانٍ</span>
        </div>
      </div>
    </div>
  );
}
