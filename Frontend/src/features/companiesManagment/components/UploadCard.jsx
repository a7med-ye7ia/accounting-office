export default function UploadCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full h-52 rounded-2xl border-2 border-dashed border-appBorder bg-appSurface
                 hover:border-brand/50 hover:bg-badgeBlueBg/30
                 flex flex-col items-center justify-center gap-3
                 ui-transition hover:scale-[1.01] shadow-panel
                 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="w-14 h-14 rounded-full bg-appMuted border border-appBorder group-hover:bg-brand/10 group-hover:border-brand/30 flex items-center justify-center ui-transition group-hover:scale-110">
        <svg
          className="w-7 h-7 text-appSubtext group-hover:text-brand ui-transition"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>

      <span className="text-sm font-medium text-appText group-hover:text-brand ui-transition">رفع ملف جديد</span>
      <span className="text-xs text-appSubtext group-hover:text-appText ui-transition">Upload File</span>

      <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-appBorder group-hover:bg-brand ui-transition" />
      <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-appBorder group-hover:bg-brand ui-transition" />
    </button>
  );
}
