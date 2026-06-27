// ─────────────────────────────────────────────────────────
// ArticlePickerOverlay — searchable article selection sheet
// ─────────────────────────────────────────────────────────
import { useState } from "react";

export default function ArticlePickerOverlay({ articles, selectedId, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? articles.filter(
        (a) =>
          String(a.title ?? "").includes(search) ||
          String(a.content ?? "").includes(search) ||
          String(a.id).includes(search)
      )
    : articles;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end md:items-center justify-center p-4"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl
                   max-h-[82vh] flex flex-col overflow-hidden
                   animate-[slideUp_0.25s_ease-out]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-white font-extrabold text-lg">اختر مادة</h3>
            <p className="text-emerald-100 text-xs mt-0.5">
              {articles.length} مادة متاحة
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl p-2 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالكلمات الحرفية…"
                className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Articles list */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              لا توجد نتائج مطابقة
            </div>
          ) : (
            filtered.map((article) => {
              const isSelected = String(article.id) === String(selectedId);
              return (
                <div
                  key={article.id}
                  onClick={() => {
                    onSelect(article);
                    onClose();
                  }}
                  className={`group relative rounded-2xl p-4 border-2 transition-all duration-200 cursor-pointer
                              hover:shadow-md
                              ${
                                isSelected
                                  ? "border-emerald-400 bg-emerald-50"
                                  : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                              }`}
                >
                  <div className="flex items-start gap-3">
                    {/* ID badge */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors
                                  ${
                                    isSelected
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"
                                  }`}
                    >
                      {article.id}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-2 mb-1 justify-between flex-wrap">
                        <h4
                          className={`font-bold text-sm transition-colors
                                      ${isSelected ? "text-emerald-800" : "text-slate-800 group-hover:text-emerald-700"}`}
                        >
                          {article.title}
                        </h4>
                        {article.subtitle && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {article.subtitle}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {article.content}
                      </p>
                    </div>

                    {/* Checkmark */}
                    {isSelected && (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center self-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
