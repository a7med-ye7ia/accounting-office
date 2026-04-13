import AppShell from "../components/AppShell";
import ResponsiveTable from "../components/ResponsiveTable";

const columns = [
  { key: "task", label: "Task" },
  { key: "company", label: "Company" },
  { key: "priority", label: "Priority" },
  { key: "status", label: "Status", type: "status" },
];

const rows = [
  { task: "Quarterly VAT Reconciliation", company: "Nordic Logistics Ltd.", priority: "Critical", status: "In Progress" },
  { task: "Employee Expense Audit", company: "TechFlow Solutions", priority: "Medium", status: "Pending Review" },
  { task: "Payroll Tax Filing", company: "Urban Sprawl Group", priority: "Critical", status: "In Progress" },
];

function MyTasksPage() {
  return (
    <AppShell title="Assigned Tasks" subtitle="Personnel Workflow">
      <section className="rounded-2xl bg-white">
        <div className="p-6">
          <h3 className="text-lg font-bold">Task Board</h3>
        </div>
        <ResponsiveTable columns={columns} rows={rows} />
      </section>
    </AppShell>
  );
}

export default MyTasksPage;
