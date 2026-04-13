import MainLayout from "../../../shared/layout/MainLayout";

function ContractAiPage() {
  return (
    <MainLayout title="Contract AI" subtitle="Contracts">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-appSurface p-6"><p className="text-xs uppercase tracking-wider text-appSubtext">Draft Contracts</p><p className="mt-2 text-4xl font-extrabold">86</p></div>
        <div className="rounded-2xl bg-appSurface p-6"><p className="text-xs uppercase tracking-wider text-appSubtext">AI Suggestions</p><p className="mt-2 text-4xl font-extrabold text-brand">240</p></div>
        <div className="rounded-2xl bg-appSurface p-6"><p className="text-xs uppercase tracking-wider text-appSubtext">Risk Flags</p><p className="mt-2 text-4xl font-extrabold text-danger">12</p></div>
      </div>
    </MainLayout>
  );
}

export default ContractAiPage;
