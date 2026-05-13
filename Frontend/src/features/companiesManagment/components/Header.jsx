import { useNavigate } from "react-router-dom";

export default function Header({ showBack, onBack }) {
  const navigate = useNavigate();

  return (
    <header className="z-40 shrink-0 border-b border-appBorder bg-appSurface/80 shadow-panel backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate("/Dashboard")}
          className="flex items-center gap-3 cursor-pointer group text-right ui-transition"
        >
          <div className="w-11 h-11 bg-gradient-to-br from-brand to-brandDeep rounded-2xl flex items-center justify-center shadow-panel ui-transition group-hover:opacity-95">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-appText group-hover:text-brand ui-transition">
              نظام إدارة العقود
            </h1>
            <p className="text-xs text-appSubtext">Contract Management System</p>
          </div>
        </button>

        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-appText bg-appMuted hover:bg-appBorder/80 border border-appBorder px-4 py-2.5 rounded-xl ui-transition"
          >
            <svg className="w-4 h-4 text-appSubtext" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            رجوع
          </button>
        )}
      </div>
    </header>
  );
}
