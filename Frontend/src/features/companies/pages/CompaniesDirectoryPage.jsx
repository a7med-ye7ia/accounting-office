import MainLayout from "../../../shared/layout/MainLayout";

function CompaniesDirectoryPage() {
  return (
    <MainLayout title="Companies" subtitle="Entity Management">
      <div className="rounded-2xl bg-appSurface p-6">
        <h3 className="text-xl font-bold">Managed Companies</h3>
        <p className="mt-2 text-sm text-appSubtext">Directory, activity, contracts, and financial relationship tracking.</p>
      </div>
    </MainLayout>
  );
}

export default CompaniesDirectoryPage;
