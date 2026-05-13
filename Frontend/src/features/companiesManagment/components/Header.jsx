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
      </div>
    </header>
  );
}