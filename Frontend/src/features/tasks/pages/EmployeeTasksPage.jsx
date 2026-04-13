import MainLayout from "../../../shared/layout/MainLayout";

function EmployeeTasksPage() {
  return (
    <MainLayout title="Assigned Tasks" subtitle="Personnel Workflow">
      <div className="rounded-2xl bg-appSurface p-6">
        <h3 className="text-xl font-bold">Employee Tasks</h3>
        <p className="mt-2 text-sm text-appSubtext">Track personal task states, deadlines, and company-linked workflow execution.</p>
      </div>
    </MainLayout>
  );
}

export default EmployeeTasksPage;
