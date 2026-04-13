import AppShell from "../components/AppShell";

function DashboardPage() {
  return (
    <AppShell title="Operations Dashboard" subtitle="Overview Matrix">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 rounded-2xl bg-white p-7 lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Total Companies</p>
          <p className="mt-3 text-6xl font-extrabold text-blue-700">1,284</p>
          <p className="mt-6 text-base font-semibold text-emerald-600">+12% from last month</p>
        </div>
        <div className="col-span-12 rounded-2xl bg-white p-7 lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Active Contracts</p>
          <p className="mt-3 text-6xl font-extrabold text-slate-800">842</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-slate-200">
              <div className="h-1.5 w-3/4 rounded-full bg-indigo-700" />
            </div>
            <p className="text-xs font-semibold text-slate-500">75%</p>
          </div>
        </div>
        <div className="col-span-12 rounded-2xl bg-white p-7 lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Pending Tasks</p>
          <p className="mt-3 text-6xl font-extrabold text-rose-700">14</p>
          <p className="mt-6 inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Requires Attention</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-12 gap-4">
        <section className="col-span-12 rounded-2xl bg-white lg:col-span-8">
          <div className="flex items-center justify-between p-6">
            <h3 className="text-3xl font-bold text-slate-900">Pending Document Reviews</h3>
            <button className="text-sm font-semibold text-blue-700">View All Documents</button>
          </div>
          <div className="hidden border-t border-slate-100 md:block">
            <div className="grid grid-cols-4 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <p>Company</p>
              <p>Document Type</p>
              <p>Due Date</p>
              <p>Status</p>
            </div>
            {[
              ["Modern Logistics Ltd.", "Quarterly VAT Return", "Oct 24, 2023", "Reviewing"],
              ["Nexus Arc Systems", "Annual Audit Prep", "Oct 28, 2023", "Pending"],
              ["Global FinTech Corp", "Payroll Reconciliation", "Oct 22, 2023", "Overdue"],
              ["Studio Vertex", "Tax Compliance Doc", "Nov 02, 2023", "Pending"],
            ].map((row, index) => (
              <div key={row[0]} className={`grid grid-cols-4 px-6 py-5 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                <p className="text-sm font-semibold text-slate-900">{row[0]}</p>
                <p className="text-sm text-slate-700">{row[1]}</p>
                <p className="text-sm text-slate-700">{row[2]}</p>
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                      row[3] === "Overdue" ? "bg-rose-100 text-rose-700" : row[3] === "Reviewing" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {row[3]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="col-span-12 space-y-4 lg:col-span-4">
          <div className="rounded-2xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">System Alerts</h4>
              <span className="h-2 w-2 rounded-full bg-rose-400" />
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border-l-4 border-rose-500 bg-slate-50 p-4">
                <p className="text-xs font-bold text-rose-700">Critical Action</p>
                <p className="mt-1 text-sm text-slate-700">Tax deadline for 12 clients expires in 48 hours.</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-blue-700">Update</p>
                <p className="mt-1 text-sm text-slate-700">Monthly reconciliation reports are now available for download.</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-600">Teammate</p>
                <p className="mt-1 text-sm text-slate-700">Marcus tagged you in a comment on Client X Payroll.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-blue-700 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">Pending Tasks</p>
              <p className="mt-1 text-4xl font-extrabold">24</p>
            </div>
            <div className="rounded-xl bg-slate-200 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Work Time</p>
              <p className="mt-1 text-4xl font-extrabold text-slate-800">162h</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-5">
            <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Assigned Departments</h4>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between"><p>Corporate Tax</p><p className="text-slate-500">12 Agents</p></div>
              <div className="flex items-center justify-between"><p>Auditing</p><p className="text-slate-500">08 Agents</p></div>
              <div className="flex items-center justify-between"><p>Asset Mgmt</p><p className="text-slate-500">05 Agents</p></div>
            </div>
            <div className="mt-6 h-32 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200" />
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl bg-white p-6">
        <h3 className="text-2xl font-bold text-slate-900">Recent Ledger Activity</h3>
        <div className="mt-5 space-y-3">
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Sarah Jenkins uploaded 4 new bank statements for Nexus Arc Systems</div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Automated Auditor verified compliance for Modern Logistics Ltd.</div>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">Marcus Vane created a new contract draft for Alpha Construction</div>
        </div>
      </section>
    </AppShell>
  );
}

export default DashboardPage;
