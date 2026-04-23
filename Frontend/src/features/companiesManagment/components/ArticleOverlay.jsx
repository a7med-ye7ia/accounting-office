export default function ArticleOverlay({ articles, onSelectArticle, type }) {
  const isEstablishment = type === "establishment";
  
  const colors = {
    border: isEstablishment ? "hover:border-indigo-400" : "hover:border-amber-400",
    shadow: isEstablishment ? "hover:shadow-indigo-100" : "hover:shadow-amber-100",
    ring: isEstablishment ? "focus:ring-indigo-400" : "focus:ring-amber-400",
    badgeBg: isEstablishment ? "bg-indigo-100 group-hover:bg-indigo-600" : "bg-amber-100 group-hover:bg-amber-600",
    badgeText: isEstablishment ? "text-indigo-600" : "text-amber-600",
    titleHover: isEstablishment ? "group-hover:text-indigo-600" : "group-hover:text-amber-600",
    labelBg: isEstablishment ? "bg-indigo-100" : "bg-amber-100",
    labelText: isEstablishment ? "text-indigo-600" : "text-amber-600",
  };

  return (
    <div className="space-y-3">
      {articles.map((article, index) => (
        <button
          key={article.id}
          onClick={() => onSelectArticle(article)}
          className={`group w-full text-right bg-white rounded-xl p-5
                     border-2 border-slate-200 shadow-sm transition-all duration-300 
                     hover:scale-[1.015] cursor-pointer focus:outline-none focus:ring-2 
                     hover:shadow-lg ${colors.border} ${colors.shadow} ${colors.ring}`}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-start gap-4">
            {/* Number Badge */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                          transition-colors duration-300 ${colors.badgeBg}`}
            >
              <span className={`font-bold text-sm transition-colors duration-300 group-hover:text-white ${colors.badgeText}`}>
                {article.id}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-bold text-slate-800 transition-colors ${colors.titleHover}`}>
                  {article.title}
                </h4>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {article.subtitle}
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                {article.content}
              </p>
            </div>

            {/* Hover Label */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-center hidden sm:block">
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-full ${colors.labelBg} ${colors.labelText}`}>
                فتح المحادثة
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}