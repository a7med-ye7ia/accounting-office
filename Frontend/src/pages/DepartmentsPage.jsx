import AppShell from "../components/AppShell";

const departments = ["Legal", "Company Establishment", "Taxes", "Insurance", "Liquidation", "Archive"];

function DepartmentsPage() {
  return (
    <AppShell title="Departments" subtitle="Internal Organization">
      <div className="grid gap-4 md:grid-cols-3">
        {departments.map((department) => (
          <div key={department} className="rounded-2xl bg-appSurface p-5">
            <p className="text-sm font-semibold">{department}</p>
            <p className="mt-1 text-xs text-appSubtext">Team capacity and assignments are ready for API mapping.</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

export default DepartmentsPage;
