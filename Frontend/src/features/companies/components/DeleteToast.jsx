import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

export default function DeleteToast({ contract, onUndo, onExpire }) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const interval = setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    const expireTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onExpire(contract.id), 220);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(expireTimer);
    };
  }, [contract.id, onExpire]);

  const handleUndo = () => {
    setIsVisible(false);
    setTimeout(() => onUndo(contract), 220);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 ui-transition ${
        isVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
      dir="rtl"
    >
      <div className="min-w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-appBorder bg-appSurface shadow-raise">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-danger/20 bg-danger/10 text-danger">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-appText">تم حذف العقد مؤقتًا</p>
              <p className="mt-0.5 truncate text-xs text-appSubtext">{contract.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-appBorder bg-appMuted px-3 text-xs font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            تراجع
          </button>
        </div>

        <div className="h-1 bg-appBorder">
          <div className="h-full rounded-full bg-danger animate-shrink" />
        </div>

        <div className="flex items-center justify-between px-4 py-2 text-[11px] text-appSubtext">
          <span>سيتم الحذف نهائيًا خلال</span>
          <span className="font-mono tabular-nums">{timeLeft} ثوانٍ</span>
        </div>
      </div>
    </div>
  );
}
