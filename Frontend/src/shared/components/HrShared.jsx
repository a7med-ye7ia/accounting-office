// Shared HR UI primitives — used across Departments, Employees, and Tasks pages

import React from "react";
import { X } from "lucide-react";

const AVATAR_STYLES = [
  "bg-brand text-white",
  "bg-brandDeep text-white",
  "bg-success text-white",
  "bg-danger text-white",
  "bg-badgePurpleBg text-badgePurpleText",
  "bg-badgeBlueBg text-badgeBlueText",
];

export function Avatar({ initials = "??", size = "md" }) {
  const color =
    AVATAR_STYLES[
      Math.abs(
        initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)
      ) % AVATAR_STYLES.length
    ];
  const sz =
    size === "lg"
      ? "w-12 h-12 text-sm"
      : size === "sm"
        ? "w-7 h-7 text-[10px]"
        : "w-8 h-8 text-xs";
  return (
    <div
      className={`${color} ${sz} rounded-full flex items-center justify-center font-bold shrink-0 select-none ui-transition`}
    >
      {initials}
    </div>
  );
}

const STATUS_MAP = {
  Active: "bg-badgeBlueBg text-badgeBlueText",
  "On-Leave": "bg-badgePurpleBg text-badgePurpleText",
  Terminated: "bg-badgeRedBg text-badgeRedText",
  Inactive: "bg-badgeGrayBg text-badgeGrayText",
  نشط: "bg-badgeBlueBg text-badgeBlueText",
  "في إجازة": "bg-badgePurpleBg text-badgePurpleText",
  "منتهي الخدمة": "bg-badgeRedBg text-badgeRedText",
  ACTIVE: "bg-badgeBlueBg text-badgeBlueText",
  SUSPENDED: "bg-badgePurpleBg text-badgePurpleText",
  RESIGNED: "bg-badgeRedBg text-badgeRedText",
};

const STATUS_DOT = {
  Active: "bg-brand",
  "On-Leave": "bg-badgePurpleText",
  Terminated: "bg-danger",
  Inactive: "bg-appSubtext",
  نشط: "bg-brand",
  "في إجازة": "bg-badgePurpleText",
  "منتهي الخدمة": "bg-danger",
  ACTIVE: "bg-brand",
  SUSPENDED: "bg-badgePurpleText",
  RESIGNED: "bg-danger",
};

export function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || "bg-badgeGrayBg text-badgeGrayText";
  const dotCls = STATUS_DOT[status] || "bg-appSubtext";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ui-transition ${cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      {status}
    </span>
  );
}

const PRIORITY_MAP = {
  High: "bg-badgeRedBg text-badgeRedText border border-appBorder",
  Medium: "bg-badgePurpleBg text-badgePurpleText border border-appBorder",
  Low: "bg-badgeBlueBg text-badgeBlueText border border-appBorder",
};

export function PriorityBadge({ priority }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ui-transition ${PRIORITY_MAP[priority] || PRIORITY_MAP.Low}`}
    >
      {priority}
    </span>
  );
}

/**
 * Dashboard-style metric card: icon top corner, label mid, large value bottom (scannable).
 * Props: icon (Lucide component), label, value, colorClass (Tailwind), optional loading.
 */
export function PageStatCard({ icon, label, value, colorClass, loading = false }) {
  const display = loading ? "—" : value;
  return (
    <div className="relative flex min-h-[128px] flex-col overflow-hidden rounded-3xl border border-appBorder bg-appSurface p-5 shadow-panel shadow-raise-hover ui-transition sm:min-h-[136px] sm:p-6">
      <div
        className={`absolute start-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-appBorder ${colorClass}`}
      >
        {React.createElement(icon, { size: 18 })}
      </div>
      <p className="mt-14 text-sm font-semibold leading-snug text-appSubtext sm:mt-16">{label}</p>
      <p className="mt-auto pt-3 font-display text-2xl font-extrabold tabular-nums tracking-tight text-appText sm:text-3xl">
        {display}
      </p>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-appBorder">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <div
                className="h-3.5 rounded-lg bg-appMuted animate-pulse"
                style={{
                  width:
                    c === 0 ? "2rem" : c === cols - 1 ? "4rem" : `${55 + c * 12}%`,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function CardSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-appSurface rounded-3xl border border-appBorder shadow-panel p-6 space-y-3 animate-pulse"
        >
          <div className="h-3.5 w-3/4 rounded-lg bg-appMuted" />
          <div className="h-3 w-1/2 rounded-lg bg-appMuted" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-6 w-6 rounded-full bg-appMuted" />
            <div className="h-3 w-24 rounded-lg bg-appMuted" />
            <div className="h-5 w-12 rounded-full bg-appMuted ms-auto" />
          </div>
        </div>
      ))}
    </>
  );
}

const MODAL_MAX = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {() => void} props.onClose
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.footer]
 * @param {'sm'|'md'|'lg'|'xl'} [props.size]
 * @param {boolean} [props.busy]
 * @param {boolean} [props.bodyScroll]
 */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "md",
  busy = false,
  bodyScroll = false,
}) {
  const maxW = MODAL_MAX[size] || MODAL_MAX.md;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-appText/35 backdrop-blur-md ui-transition"
      onClick={busy ? undefined : onClose}
      role="presentation"
    >
      <div
        className={`bg-appSurface rounded-3xl border border-appBorder shadow-raise w-full ${maxW} overflow-hidden ui-transition max-h-[min(92dvh,900px)] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-busy={busy}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-appBorder bg-appMuted/25 px-6 py-4 sm:px-8 sm:py-5">
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-appText">{title}</h2>
            {subtitle && (
              <p className="text-xs font-medium leading-relaxed text-appSubtext">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!busy) onClose();
            }}
            className="shrink-0 rounded-xl p-2 text-appSubtext ui-transition hover:bg-appMuted hover:text-appText disabled:pointer-events-none disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>
        <div
          className={`px-6 py-5 sm:px-8 sm:py-6 ${bodyScroll ? "min-h-0 flex-1 overflow-y-auto scroll-smooth" : ""}`}
        >
          {children}
        </div>
        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-appBorder bg-appMuted/40 px-6 py-4 sm:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function SlideOver({ title, subtitle, onClose, children }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-appText/30 backdrop-blur-sm z-40 ui-transition"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden border-l border-appBorder bg-appSurface shadow-raise ui-transition">
        <div className="flex items-start justify-between px-6 py-5 border-b border-appBorder shrink-0">
          <div>
            <h2 className="text-base font-semibold text-appText">{title}</h2>
            {subtitle && (
              <p className="text-xs text-appSubtext mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-appSubtext hover:bg-appMuted hover:text-appText ui-transition mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

export function BudgetBar({ used, total }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const color =
    pct > 85 ? "bg-danger" : pct > 65 ? "bg-brand" : "bg-success";
  return (
    <div className="flex min-w-[130px] items-center gap-2.5">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-appMuted ring-1 ring-appBorder/80">
        <div
          className={`h-full rounded-full shadow-sm ui-transition ${color}`}
          style={{ width: `${pct}%`, minWidth: pct > 0 ? "4px" : undefined }}
        />
      </div>
      <span className="w-9 shrink-0 text-end text-xs font-bold tabular-nums text-appText">
        {pct}%
      </span>
    </div>
  );
}
