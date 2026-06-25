// ─────────────────────────────────────────────────────────
// DocumentLoader — AI "thinking" animation
// ─────────────────────────────────────────────────────────

export default function DocumentLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[180px] gap-5">
      <div className="relative w-14 h-18">
        {/* Page shadow */}
        <div className="absolute top-1 left-1 w-12 h-16 bg-slate-200 rounded-lg" />
        {/* Main document */}
        <div className="relative w-12 h-16 bg-white border-2 border-slate-300 rounded-lg shadow-md overflow-hidden">
          {/* Folded corner */}
          <div
            className="absolute top-0 right-0 w-4 h-4 bg-slate-100"
            style={{
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
              borderLeft: "2px solid #cbd5e1",
              borderBottom: "2px solid #cbd5e1",
            }}
          />
          {/* Animated content lines */}
          <div className="absolute inset-0 flex flex-col justify-end p-2 pt-5 gap-1.5">
            {[100, 100, 100, 60].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full bg-emerald-300"
                style={{
                  width: `${w}%`,
                  animation: `pulse 1.2s ease-in-out ${i * 150}ms infinite`,
                  opacity: 0.7 + i * 0.075,
                }}
              />
            ))}
          </div>
        </div>
        {/* Sparkle badge */}
        <div
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full
                     bg-gradient-to-br from-emerald-400 to-teal-600
                     flex items-center justify-center shadow-md"
          style={{ animation: "bounce 1s ease-in-out infinite" }}
        >
          <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-500 animate-pulse tracking-wide">
        يعمل الذكاء الاصطناعي…
      </p>
    </div>
  );
}
