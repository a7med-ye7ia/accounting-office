import MainLayout from "../../../shared/layout/MainLayout";

const departments = ["Legal", "Company Establishment", "Taxes", "Insurance", "Liquidation", "Archive"];

function DepartmentsPage() {
  return (
    <MainLayout title="Departments" subtitle="Internal Organization">
      <div className="grid gap-4 md:grid-cols-3">
        {departments.map((department) => (
          <div key={department} className="rounded-2xl bg-appSurface p-5">
            <p className="text-sm font-semibold">{department}</p>
            <p className="mt-1 text-xs text-appSubtext">Allocation and team load are ready for backend integration.</p>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

export default DepartmentsPage;
