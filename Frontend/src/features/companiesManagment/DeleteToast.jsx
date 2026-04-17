import { useState, useEffect } from "react";

export default function DeleteToast({ contract, onUndo, onExpire }) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // Countdown timer
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

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50
                  transition-all duration-300
                  ${isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
                  }`}
      dir="rtl"
    >
      <div className="bg-white-900 text-slate-900 rounded-2xl shadow-2xl px-6 py-4 min-w-[380px]">
        {/* Content */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            {/* Trash Icon */}
            <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">تم حذف العقد بنجاح</p>
              <p className="text-xs text-slate-400 mt-0.5">"{contract.name}"</p>
            </div>
          </div>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl
                       ${contract.type == "establishment" ? "bg-indigo-500 hover:bg-indigo-400" : "bg-amber-500 hover:bg-amber-400"}
                       text-white text-sm font-medium
                       transition-all duration-200 cursor-pointer
                       hover:scale-105`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            تراجع
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full 
              ${contract.type == "establishment" ? "bg-gradient-to-l from-indigo-500 to-indigo-400" : "bg-gradient-to-l from-amber-500 to-amber-400" }
               rounded-full animate-shrink`}
          />
        </div>

        {/* Timer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-slate-500">
            سيتم الحذف نهائياً خلال
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {timeLeft} ثوانٍ
          </span>
        </div>
      </div>
    </div>
  );
}