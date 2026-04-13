const palette = {
  Active: "bg-indigo-100 text-indigo-700",
  Reviewing: "bg-blue-100 text-blue-700",
  Pending: "bg-slate-200 text-slate-700",
  "Pending Review": "bg-slate-200 text-slate-700",
  Overdue: "bg-rose-100 text-rose-700",
  Inactive: "bg-rose-100 text-rose-700",
  Verified: "bg-violet-100 text-violet-700",
  "In Progress": "bg-cyan-100 text-cyan-700",
  "Not Started": "bg-slate-200 text-slate-700",
  Complete: "bg-emerald-100 text-emerald-700",
  Critical: "bg-rose-100 text-rose-700",
};

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${palette[status] ?? "bg-slate-200 text-slate-700"}`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
