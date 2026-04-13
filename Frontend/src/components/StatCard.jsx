function StatCard({ label, value, tone = "text-slate-900", hint }) {
  return (
    <div className="rounded-2xl bg-white p-6">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-3xl font-extrabold ${tone}`}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default StatCard;
