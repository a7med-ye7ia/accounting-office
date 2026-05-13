import { useState } from "react";

export default function ContractCard({ contract, onDelete, onEdit }) {
  const [showOverlay, setShowOverlay] = useState(false);

  const isEstablishment = contract.type === "establishment";
  const typeLabel = isEstablishment ? "تأسيس" : "تعديل";

  const badgeClass = isEstablishment
    ? "bg-badgeBlueBg text-badgeBlueText border border-appBorder"
    : "bg-badgePurpleBg text-badgePurpleText border border-appBorder";
  const pdfWrapClass = isEstablishment ? "bg-badgeBlueBg/80" : "bg-badgePurpleBg/80";
  const pdfIconClass = isEstablishment ? "text-badgeBlueText" : "text-badgePurpleText";

  return (
    <div
      className="group relative rounded-2xl border border-appBorder bg-appSurface shadow-panel overflow-hidden ui-transition hover:border-brand/25"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
            {typeLabel}
          </span>
          <span className="text-xs text-appSubtext">{contract.date}</span>
        </div>

        <div className="flex justify-center mb-4">
          <div
            className={`w-16 h-20 rounded-xl flex flex-col items-center justify-center ${pdfWrapClass} ui-transition group-hover:scale-105 duration-200 ease-out`}
          >
            <svg
              className={`w-8 h-8 mb-1 ${pdfIconClass}`}
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
            <span className={`text-[10px] font-bold ${pdfIconClass}`}>PDF</span>
          </div>
        </div>

        <h4 className="text-sm font-semibold text-appText text-center mb-1 line-clamp-2 leading-snug">
          {contract.name}
        </h4>
        {contract.size && (
          <p className="text-xs text-appSubtext text-center">{contract.size}</p>
        )}
      </div>

      <div
        className={`absolute inset-0 bg-appText/25 backdrop-blur-[2px] flex items-center justify-center gap-3 ui-transition ${
          showOverlay ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(contract);
          }}
          className={`w-11 h-11 rounded-xl bg-appSurface/95 border border-appBorder flex items-center justify-center ui-transition hover:scale-110 hover:bg-brand hover:border-brand shadow-panel group/btn ${
            showOverlay ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          title="تعديل"
        >
          <svg
            className="w-5 h-5 text-brand group-hover/btn:text-white ui-transition"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(contract);
          }}
          className={`w-11 h-11 rounded-xl bg-appSurface/95 border border-appBorder flex items-center justify-center ui-transition hover:scale-110 hover:bg-danger hover:border-danger shadow-panel group/btn ${
            showOverlay ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "80ms" }}
          title="حذف"
        >
          <svg
            className="w-5 h-5 text-danger group-hover/btn:text-white ui-transition"
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
