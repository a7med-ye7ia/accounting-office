import AppShell from "../components/AppShell";
import ResponsiveTable from "../components/ResponsiveTable";
import StatCard from "../components/StatCard";

const columns = [
  { key: "reference", label: "Reference ID" },
  { key: "description", label: "Description" },
  { key: "value", label: "Value (USD)" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status", type: "status" },
];

const rows = [
  { reference: "TRX-94821", description: "Ocean Freight - Port Fees", value: "$12,450.00", date: "Oct 24, 2023", status: "Pending Review" },
  { reference: "TRX-94820", description: "Annual Storage Contract", value: "$245,000.00", date: "Oct 23, 2023", status: "Verified" },
];

function CompanyProfilePage() {
  return (
    <AppShell title="Global Logistics Inc." subtitle="Companies">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Current Balance" value="$2,412,080" tone="text-blue-700" />
        <StatCard label="Active Contracts" value="14" />
        <StatCard label="Last Audit" value="Oct 24" hint="Next in 12 days" />
      </div>
      <section className="mt-8 rounded-2xl bg-white">
        <div className="p-6">
          <h3 className="text-lg font-bold">Pending Ledger Approvals</h3>
        </div>
        <ResponsiveTable columns={columns} rows={rows} />
      </section>
    </AppShell>
  );
}

export default CompanyProfilePage;
