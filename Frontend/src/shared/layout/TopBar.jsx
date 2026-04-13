function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-appBorder bg-appSurface px-6">
      <div className="w-full max-w-xl">
        <input
          className="w-full rounded bg-appMuted px-4 py-2 text-sm font-medium text-appText outline-none ring-brand focus:ring-2"
          placeholder="Search accounts, companies, or records..."
          type="text"
        />
      </div>
      <div className="ml-6 flex items-center gap-4">
        <span className="h-4 w-4 rounded-full bg-slate-500" />
        <span className="h-4 w-4 rounded-sm bg-slate-500" />
        <span className="h-4 w-4 rounded-full bg-slate-500" />
        <div className="h-6 w-px bg-appBorder" />
        <button className="rounded-lg bg-gradient-to-b from-brand to-brandDeep px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white">
          Add New
        </button>
        <span className="h-7 w-7 rounded-full bg-slate-300" />
      </div>
    </header>
  );
}

export default TopBar;
