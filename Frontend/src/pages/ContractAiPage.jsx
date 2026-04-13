import AppShell from "../components/AppShell";
import StatCard from "../components/StatCard";

function ContractAiPage() {
  return (
    <AppShell title="Contract AI" subtitle="Contracts">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Draft Contracts" value="86" />
        <StatCard label="AI Suggested Amendments" value="240" tone="text-blue-700" />
        <StatCard label="Risk Flags" value="12" tone="text-rose-700" />
      </div>
      <div className="mt-8 rounded-2xl bg-white p-6">
        <h3 className="text-lg font-bold">AI Amendment Queue</h3>
        <p className="mt-3 text-sm text-slate-600">
          Review generated legal amendments, compare clause versions, and approve changes before publishing a new contract version.
        </p>
      </div>
    </AppShell>
  );
}

export default ContractAiPage;
