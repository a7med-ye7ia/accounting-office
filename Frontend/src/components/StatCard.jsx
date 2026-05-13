function StatCard({ label, value, tone = "text-appText", hint }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-appBorder bg-appSurface p-7 shadow-panel shadow-raise-hover sm:p-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-l from-brand via-brandDeep to-brand opacity-90"
        aria-hidden
      />
      <p className="relative mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-appSubtext sm:text-[11px]">
        {label}
      </p>
      <p className={`relative font-display text-4xl font-extrabold tabular-nums tracking-tight sm:text-5xl ${tone}`}>
        {value}
      </p>
      {hint ? (
        <p className="relative mt-4 text-sm font-medium leading-relaxed text-appSubtext">{hint}</p>
      ) : null}
    </div>
  );
}

export default StatCard;
