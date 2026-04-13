import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/Dashboard" },
  { label: "Companies", path: "/CompaniesDirectory" },
  { label: "Documents", path: "/Documents" },
  { label: "Employees", path: "/EmployeeManagement" },
  { label: "Employee Tasks", path: "/MyTasks" },
  { label: "Departments", path: "/Departments" },
  { label: "Contracts", path: "/ContractAi" },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-slate-100 lg:flex">
      <div className="px-6 pt-6">
        <h1 className="text-[34px] font-black uppercase leading-8 tracking-tight text-blue-900"></h1>
        <p className="mt-2 text-xs text-slate-500">Accounting Management</p>
      </div>
      <div>
      </div>
      <nav className="mt-8 space-y-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] transition ${isActive ? "border-l-4 border-blue-600 bg-slate-100 text-blue-700" : "text-slate-600 hover:bg-slate-200"}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <button className="w-full rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 py-3 text-sm font-bold text-white shadow-md">New Entry</button>
      </div>
      <div className="border-t border-slate-200 px-6 py-4">
        <p className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Settings</p>
        <p className="py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Support</p>
      </div>
    </aside>
  );
}

export default Sidebar;
