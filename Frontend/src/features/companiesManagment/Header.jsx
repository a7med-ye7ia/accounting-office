import { useNavigate } from "react-router-dom";

export default function Header({ showBack, onBack }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo — click to go back to the main app */}
        <button
          onClick={() => navigate("/Dashboard")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
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
          <div className="text-right">
            <h1 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
              نظام إدارة العقود
            </h1>
            <p className="text-xs text-slate-500">Contract Management System</p>
          </div>
        </button>

        {/* Back Button */}
        {showBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600
                       bg-slate-100 hover:bg-indigo-50 px-4 py-2 rounded-lg
                       transition-all duration-200 cursor-pointer"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            رجوع
          </button>
        )}
      </div>
    </header>
  );
}