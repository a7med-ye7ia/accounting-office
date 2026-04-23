export default function UploadCard({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full h-52 rounded-2xl
                 border-2 border-dashed border-slate-300
                 hover:border-green-400 hover:bg-green-50/50
                 bg-white
                 flex flex-col items-center justify-center gap-3
                 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-400"
    >
      {/* Plus Icon */}
      <div
        className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-green-100
                    flex items-center justify-center
                    transition-all duration-300 group-hover:scale-110"
      >
        <svg
          className="w-7 h-7 text-slate-400 group-hover:text-green-500 transition-colors duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>

      {/* Text */}
      <span className="text-sm font-medium text-slate-500 group-hover:text-green-600 transition-colors duration-300">
        رفع ملف جديد
      </span>
      <span className="text-xs text-slate-400 group-hover:text-green-400 transition-colors duration-300">
        Upload File
      </span>

      {/* Corner decoration */}
      <div
        className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-200
                    group-hover:bg-green-400 transition-colors duration-300"
      />
      <div
        className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-200
                    group-hover:bg-green-400 transition-colors duration-300"
      />
    </button>
  );
}