import MainLayout from "../../../shared/layout/MainLayout";

function CompanyProfilePage() {
  return (
    <MainLayout title="Global Logistics Inc." subtitle="Companies">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-appSurface p-6"><p className="text-xs uppercase tracking-wider text-appSubtext">Current Balance</p><p className="mt-2 text-4xl font-extrabold text-brand">$2,412,080</p></div>
        <div className="rounded-2xl bg-appSurface p-6"><p className="text-xs uppercase tracking-wider text-appSubtext">Active Contracts</p><p className="mt-2 text-4xl font-extrabold">14</p></div>
        <div className="rounded-2xl bg-appSurface p-6"><p className="text-xs uppercase tracking-wider text-appSubtext">Last Audit</p><p className="mt-2 text-4xl font-extrabold">Oct 24</p></div>
      </div>
    </MainLayout>
  );
}

export default CompanyProfilePage;
