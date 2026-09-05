export default function ArticleOverlay({ articles, onSelectArticle, type }) {
  const isEstablishment = type === "establishment";

  const accent = isEstablishment
    ? {
        border: "hover:border-brand/50",
        badge: "bg-badgeBlueBg group-hover:bg-brand",
        badgeText: "text-badgeBlueText group-hover:text-white",
        title: "group-hover:text-brand",
        chip: "bg-appMuted text-appSubtext",
        label: "bg-badgeBlueBg text-badgeBlueText",
      }
    : {
        border: "hover:border-badgePurpleText/50",
        badge: "bg-badgePurpleBg group-hover:bg-brandDeep",
        badgeText: "text-badgePurpleText group-hover:text-white",
        title: "group-hover:text-badgePurpleText",
        chip: "bg-appMuted text-appSubtext",
        label: "bg-badgePurpleBg text-badgePurpleText",
      };

  return (
    <div className="space-y-3">
      {articles.map((article, index) => (
        <button
          key={article.id}
          type="button"
          onClick={() => onSelectArticle(article)}
          className={`group w-full text-right rounded-2xl p-5 border border-appBorder bg-appSurface shadow-panel ui-transition hover:scale-[1.01] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${accent.border}`}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ui-transition ${accent.badge}`}
            >
              <span className={`font-bold text-sm ui-transition ${accent.badgeText}`}>{article.id}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className={`font-bold text-appText ui-transition ${accent.title}`}>{article.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full border border-appBorder ${accent.chip}`}>
                  {article.subtitle}
                </span>
              </div>
              <p className="text-sm text-appSubtext leading-relaxed line-clamp-2">{article.content}</p>
            </div>

            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 ui-transition self-center hidden sm:block">
              <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border border-appBorder ${accent.label}`}>
                فتح المحادثة
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
