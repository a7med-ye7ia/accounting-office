import { useState } from "react";

export default function ContractCard({ contract, onDelete, onEdit }) {
  const [showOverlay, setShowOverlay] = useState(false);

  const typeColor = contract.type === "establishment" ? "indigo" : "amber";
  const typeLabel = contract.type === "establishment" ? "تأسيس" : "تعديل";

  return (
    <div
      className="group relative bg-white rounded-2xl shadow-md
                 border border-slate-200 overflow-hidden
                 transition-all duration-300
                 hover:shadow-xl hover:scale-[1.02] hover:border-indigo-200"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {/* Card Content */}
      <div className="p-5">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${typeColor === "indigo"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-amber-100 text-amber-700"
              }`}
          >
            {typeLabel}
          </span>
          <span className="text-xs text-slate-400">{contract.date}</span>
        </div>

        {/* PDF Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-16 h-20 rounded-xl flex flex-col items-center justify-center
              ${typeColor === "indigo" ? "bg-indigo-50" : "bg-amber-50"}
              transition-transform duration-300 group-hover:scale-105`}
          >
            <svg
              className={`w-8 h-8 mb-1 ${typeColor === "indigo" ? "text-indigo-500" : "text-amber-500"
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span
              className={`text-[10px] font-bold ${typeColor === "indigo" ? "text-indigo-400" : "text-amber-400"
                }`}
            >
              PDF
            </span>
          </div>
        </div>

        {/* File Name */}
        <h4 className="text-sm font-semibold text-slate-800 text-center mb-1 line-clamp-2">
          {contract.name}
        </h4>
        {contract.size && (
          <p className="text-xs text-slate-400 text-center">{contract.size}</p>
        )}
      </div>
      {/* ====== Hover Overlay ====== */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-[1px]
              flex items-center justify-center gap-3
              transition-all duration-300
              ${showOverlay ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {/* Edit Button (The Eye Icon) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(contract);
          }}
          className={`w-11 h-11 rounded-xl bg-white/90 
               flex items-center justify-center
               transition-all duration-200 cursor-pointer
               hover:scale-110 hover:shadow-lg
               ${showOverlay ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
               ${typeColor === "indigo" ? "hover:bg-indigo-500" : "hover:bg-amber-500"}
               group/btn`}
          style={{ transitionDelay: "0ms" }}
          title="تعديل"
        >
          <svg
            className={`w-5 h-5 transition-colors group-hover/btn:text-white
                 ${typeColor === "indigo" ? "text-indigo-600" : "text-amber-600"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(contract);
          }}
          className={`w-11 h-11 rounded-xl bg-white/90 hover:bg-red-500
               flex items-center justify-center
               transition-all duration-200 cursor-pointer
               hover:scale-110 hover:shadow-lg
               ${showOverlay ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
               group/btn`}
          style={{ transitionDelay: "100ms" }}
          title="حذف"
        >
          <svg
            className="w-5 h-5 text-red-600 group-hover/btn:text-white transition-colors"
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
        </button>
      </div>
    </div>
  );
}