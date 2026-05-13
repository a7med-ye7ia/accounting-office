import React from "react";

export default function Breadcrumb({ items, type }) {
  const activeTextColor =
    type === "amendment" ? "text-badgePurpleText" : "text-brand";
  const hoverTextColor =
    type === "amendment" ? "hover:text-badgePurpleText" : "hover:text-brand";

  return (
    <nav className="flex items-center gap-2 text-sm text-appSubtext mb-6 flex-wrap" dir="rtl">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg
              className="w-4 h-4 text-appSubtext/70 rotate-180 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <button
            type="button"
            onClick={() => item.action && item.action()}
            className={`ui-transition ${
              index === items.length - 1
                ? `${activeTextColor} font-semibold cursor-default`
                : `${hoverTextColor} cursor-pointer text-appSubtext`
            }`}
            disabled={index === items.length - 1}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
