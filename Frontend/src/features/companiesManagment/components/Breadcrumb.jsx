import React from "react";

export default function Breadcrumb({ items, type }) {
  const activeTextColor =
    type === "amendment"
      ? "text-amber-600"
      : type === "other"
        ? "text-emerald-600"
        : "text-indigo-600";
  const hoverTextColor =
    type === "amendment"
      ? "hover:text-amber-500"
      : type === "other"
        ? "hover:text-emerald-500"
        : "hover:text-indigo-500";

  return (
    <nav
      className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap"
      dir="rtl"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg
              className="w-4 h-4 text-slate-400 rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          )}
          <button
            onClick={() => item.action && item.action()}
            className={`transition-colors duration-200 ${
              index === items.length - 1
                ? `${activeTextColor} font-semibold cursor-default`
                : `${hoverTextColor} cursor-pointer`
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