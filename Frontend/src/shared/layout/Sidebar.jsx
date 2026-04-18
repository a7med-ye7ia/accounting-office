import { NavLink } from "react-router-dom";
import { useSidebar } from "../../context/SidebarContext";
import { 
  LayoutDashboard, Building, FileText, Users, 
  ClipboardList, Building2, FileSignature, BookOpen, 
  X, Settings, LifeBuoy, PlusCircle 
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard },
  { label: "Companies", path: "/CompaniesDirectory", icon: Building },
  { label: "Documents", path: "/Documents", icon: FileText },
  { label: "Employees", path: "/EmployeeManagement", icon: Users },
  { label: "Employee Tasks", path: "/EmployeeTasks", icon: ClipboardList },
  { label: "Departments", path: "/Departments", icon: Building2 },
  { label: "Contracts", path: "/ContractAi", icon: FileSignature },
  { label: "Ledger", path: "/EquilibriumLedger", icon: BookOpen },
];

function Sidebar() {
  const { mobileOpen, close } = useSidebar();

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={close}
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-appBorder bg-appSurfacae lg:bg-appMuted transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl bg-appMuted" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h1 className="font-display text-2xl font-black uppercase leading-none tracking-tight text-brandDeep">Architectural<br/>Ledger</h1>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-appSubtext font-bold">Accounting Mgmt</p>
          </div>
          <button 
            onClick={close} 
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5 px-3 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={close} // close on mobile when link is clicked
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-r-lg px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] transition-all duration-200 ${
                    isActive 
                      ? "border-l-[4px] border-brand bg-brand/5 text-brand" 
                      : "border-l-[4px] border-transparent text-appSubtext hover:bg-slate-200/50 hover:text-slate-800"
                  }`
                }
              >
                <Icon size={18} className="transition-transform group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto p-4 shrink-0">
          <button className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-b from-brand to-brandDeep py-3 text-xs font-bold text-white shadow-panel hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98]">
            <PlusCircle size={16} /> New Entry
          </button>
        </div>
        
        <div className="border-t border-appBorder px-4 py-4 space-y-1 shrink-0">
          <button className="flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-appSubtext hover:bg-slate-200/50 hover:text-slate-700 transition-colors">
            <Settings size={18} /> Settings
          </button>
          <button className="flex items-center gap-3 w-full rounded-lg px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-appSubtext hover:bg-slate-200/50 hover:text-slate-700 transition-colors">
            <LifeBuoy size={18} /> Support
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
