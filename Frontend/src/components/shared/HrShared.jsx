// Shared HR UI primitives — used across Departments, Employees, and Tasks pages

import React from 'react';

// ── Avatar ────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-600', 'bg-emerald-500',
  'bg-amber-500',  'bg-rose-500', 'bg-cyan-600', 'bg-fuchsia-600',
];

export function Avatar({ initials = '??', index = 0, size = 'md' }) {
  const color = AVATAR_COLORS[Math.abs(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length];
  const sz =
    size === 'lg' ? 'w-12 h-12 text-sm'
    : size === 'sm' ? 'w-7 h-7 text-[10px]'
    : 'w-8 h-8 text-xs';
  return (
    <div className={`${color} ${sz} rounded-full flex items-center justify-center text-white font-bold shrink-0 select-none`}>
      {initials}
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────
const STATUS_MAP = {
  'Active':     'bg-emerald-50 text-emerald-700',
  'On-Leave':   'bg-amber-50   text-amber-700',
  'Terminated': 'bg-red-50     text-red-700',
  'Inactive':   'bg-slate-100  text-slate-500',
};

export function StatusBadge({ status }) {
  const cls = STATUS_MAP[status] || 'bg-slate-100 text-slate-500';
  const dotCls =
    status === 'Active'     ? 'bg-emerald-500'
    : status === 'On-Leave'  ? 'bg-amber-500'
    : status === 'Inactive'  ? 'bg-slate-400'
    : 'bg-red-500';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      {status}
    </span>
  );
}

// ── Priority Badge ────────────────────────────────────────
const PRIORITY_MAP = {
  High:   'bg-red-50    text-red-700    border border-red-200',
  Medium: 'bg-amber-50  text-amber-700  border border-amber-200',
  Low:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${PRIORITY_MAP[priority] || PRIORITY_MAP.Low}`}>
      {priority}
    </span>
  );
}

// ── Table Skeleton ────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3.5">
              <div
                className="h-3.5 rounded bg-slate-200 animate-pulse"
                style={{ width: c === 0 ? '2rem' : c === cols - 1 ? '4rem' : `${55 + c * 12}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

// ── Card Skeleton ─────────────────────────────────────────
export function CardSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 animate-pulse">
          <div className="h-3.5 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-6 w-6 rounded-full bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-5 w-12 rounded-full bg-slate-200 ml-auto" />
          </div>
        </div>
      ))}
    </>
  );
}

// ── Modal ─────────────────────────────────────────────────
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Slide-Over ────────────────────────────────────────────
export function SlideOver({ title, subtitle, onClose, children }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}

// ── Budget Progress Bar ───────────────────────────────────
export function BudgetBar({ used, total }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const color = pct > 85 ? 'bg-red-500' : pct > 65 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2 min-w-[130px]">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-slate-600 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}
