import MainLayout from "../../../shared/layout/MainLayout";

function EmployeeManagementPage() {
  return (
    <MainLayout title="Employee Directory" subtitle="Human Resources">
      <div className="rounded-2xl bg-appSurface p-6">
        <h3 className="text-xl font-bold">Employees and Roles</h3>
        <p className="mt-2 text-sm text-appSubtext">Manage user roles, departments, and assignment capacity across teams.</p>
      </div>
    </MainLayout>
  );
}

export default EmployeeManagementPage;
