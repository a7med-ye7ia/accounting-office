import AppShell from "../components/AppShell";
import ResponsiveTable from "../components/ResponsiveTable";

const columns = [
  { key: "name", label: "Company Name" },
  { key: "industry", label: "Industry" },
  { key: "contact", label: "Main Contact" },
  { key: "contracts", label: "Active Contracts" },
  { key: "status", label: "Status", type: "status" },
];

const rows = [
  { name: "Nova Ventures Ltd.", industry: "FinTech", contact: "Jane Doe", contracts: "14", status: "Active" },
  { name: "Blue Sky Logistics", industry: "Transportation", contact: "Marcus Chen", contracts: "8", status: "Active" },
  { name: "Apex Labs", industry: "Healthcare", contact: "Sarah White", contracts: "2", status: "Pending Review" },
];

function CompaniesDirectoryPage() {
  return (
    <AppShell title="Companies" subtitle="Entity Management">
      <section className="rounded-2xl bg-white">
        <div className="p-6">
          <h3 className="text-lg font-bold">Managed Companies</h3>
        </div>
        <ResponsiveTable columns={columns} rows={rows} />
      </section>
    </AppShell>
  );
}

export default CompaniesDirectoryPage;
