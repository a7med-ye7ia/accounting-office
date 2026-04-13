import AppShell from "../components/AppShell";
import ResponsiveTable from "../components/ResponsiveTable";

const columns = [
  { key: "employee", label: "Employee" },
  { key: "role", label: "Role" },
  { key: "department", label: "Department" },
  { key: "status", label: "Status", type: "status" },
  { key: "utilization", label: "Utilization" },
];

const rows = [
  { employee: "Elena Rodriguez", role: "Senior Auditor", department: "Finance & Risk", status: "Active", utilization: "85%" },
  { employee: "Marcus Thorne", role: "Lead Architect", department: "Infrastructure", status: "Pending", utilization: "0%" },
  { employee: "Sarah Jenkins", role: "Compliance Officer", department: "Legal", status: "Active", utilization: "45%" },
];

function EmployeeManagementPage() {
  return (
    <AppShell title="Employee Directory" subtitle="Human Resources">
      <section className="rounded-2xl bg-white">
        <div className="p-6">
          <h3 className="text-lg font-bold">Employees</h3>
        </div>
        <ResponsiveTable columns={columns} rows={rows} />
      </section>
    </AppShell>
  );
}

export default EmployeeManagementPage;
