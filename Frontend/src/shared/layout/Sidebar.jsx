import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/Dashboard" },
  { label: "Companies", path: "/CompaniesDirectory" },
  { label: "Documents", path: "/Documents" },
  { label: "Employees", path: "/EmployeeManagement" },
  { label: "Employee Tasks", path: "/EmployeeTasks" },
  { label: "Departments", path: "/Departments" },
  { label: "Contracts", path: "/ContractAi" },
  { label: "Ledger", path: "/EquilibriumLedger" },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-appBorder bg-appMuted lg:flex">
      <div className="px-6 pt-6">
        <h1 className="font-display text-[34px] font-black uppercase leading-8 tracking-tight text-brandDeep">Architectural Ledger</h1>
        <p className="mt-2 text-xs text-appSubtext">Accounting Management</p>
      </div>
      <nav className="mt-8 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition ${isActive ? "border-l-4 border-brand bg-appMuted text-brand" : "text-appSubtext hover:bg-slate-200"}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <button className="w-full rounded-xl bg-gradient-to-b from-brand to-brandDeep py-3 text-sm font-bold text-white shadow-panel">New Entry</button>
      </div>
      <div className="border-t border-appBorder px-6 py-4">
        <p className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-appSubtext">Settings</p>
        <p className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-appSubtext">Support</p>
      </div>
    </aside>
  );
}

export default Sidebar;
