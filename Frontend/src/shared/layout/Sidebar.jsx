import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";
import {
  LayoutDashboard,
  Building,
  FileText,
  Users,
  ClipboardList,
  Building2,
  FileSignature,
  BookOpen,
  History,
  X,
  ChevronRight,
  ChevronLeft,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "لوحة التحكم", path: "/Dashboard", icon: LayoutDashboard },
  { label: "الشركات", path: "/ContractBrowser", icon: Building },
  // { label: "المستندات", path: "/Documents", icon: FileText },
  { label: "الموظفون", path: "/EmployeeManagement", icon: Users },
  { label: "مهام الموظفين", path: "/EmployeeTasks", icon: ClipboardList },
  { label: "مهمات قيد التشغيل", path: "/AssignedTasks", icon: ClipboardList },
  { label: "الأقسام", path: "/Departments", icon: Building2 },
  // { label: "العقود", path: "/ContractAi", icon: FileSignature },
  // { label: "السجل", path: "/EquilibriumLedger", icon: BookOpen },
  // { label: "العقود", path: "/ContractAi", icon: FileSignature },
  // { label: " السجل المالي", path: "/EquilibriumLedger", icon: BookOpen },
  { label: "سجل النشاطات", path: "/ActivityHistory", icon: History },
];

function Sidebar() {
  const { isOpen, isMobile, isTablet, toggle, close } = useSidebar();

  const isDrawer = isMobile || isTablet;
  /** Desktop narrow rail: collapsed and not overlay drawer */
  const isCollapsedRail = !isOpen && !isDrawer;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");

    window.location.href = "/";
  };

  useEffect(() => {
    if (!isDrawer || !isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDrawer, isOpen]);

  return (
    <div className={isDrawer ? "contents" : "relative flex h-full min-h-0 shrink-0 self-stretch"}>
      {isDrawer && (
        <div
          role="presentation"
          aria-hidden={!isOpen}
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out dark:bg-black/50 ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={close}
        />
      )}

      <aside
        id="app-sidebar"
        className={`flex shrink-0 flex-col overflow-hidden rounded-3xl border border-appBorder bg-appSurface/85 shadow-raise backdrop-blur-2xl backdrop-saturate-150 ${
          isDrawer
            ? `fixed right-0 top-0 z-50 h-[100dvh] w-[min(18rem,calc(100vw-1rem))] max-w-[18rem] transition-transform duration-300 ease-out will-change-transform ${
                isOpen ? "translate-x-0" : "translate-x-full"
              }`
            : `relative h-full min-h-0 max-h-full self-stretch transition-[width] duration-300 ease-out ${
                isOpen ? "w-[280px]" : "w-[72px]"
              }`
        }`}
        aria-hidden={isDrawer && !isOpen}
      >
        <div
          className={`flex shrink-0 border-b border-appBorder ${
            isCollapsedRail
              ? "flex-col items-center gap-2 py-3 sm:py-3.5"
              : "h-[3.75rem] items-center gap-2 px-3 sm:h-14 sm:px-4"
          }`}
        >
          <button
            type="button"
            onClick={toggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-transparent text-appSubtext ui-transition hover:border-appBorder hover:bg-appMuted hover:text-brand active:scale-95 sm:h-11 sm:w-11"
            title={isOpen ? "طي القائمة" : "توسيع القائمة"}
          >
            {isOpen ? <ChevronRight size={20} aria-hidden /> : <ChevronLeft size={20} aria-hidden />}
          </button>

          {!isDrawer && isOpen && (
            <div className="min-w-0 flex-1 overflow-hidden text-end">
              {/* <span className="font-display block truncate text-lg font-black tracking-tight text-brand">
                المحاسبة
              </span> */}
              <span className="mt-0.5 block truncate text-[20px] font-semibold uppercase tracking-[0.14em] text-appSubtext">
                {/* Accounting Office */}
                CLARA
              </span>
            </div>
          )}

          {!isDrawer && !isOpen && (
            <div className="flex w-full shrink-0 justify-center overflow-hidden">
              <span
                className="font-display flex h-9 w-9 items-center justify-center rounded-xl border border-brand/25 bg-brand/10 text-xs font-black text-brand sm:h-10 sm:w-10"
                aria-hidden
              >
                مح
              </span>
            </div>
          )}

          {isDrawer && isOpen && (
            <div className="min-w-0 flex-1 overflow-hidden text-end">
              <span className="font-display block truncate text-lg font-black tracking-tight text-brand">
                المحاسبة
              </span>
            </div>
          )}
        </div>

        <nav
          className={`mt-1 flex min-h-0 flex-1 flex-col justify-start overflow-hidden pb-3 pt-2 sm:pb-4 sm:pt-3 ${
            isCollapsedRail
              ? "items-center gap-2 px-0 sm:gap-2"
              : "items-stretch gap-1.5 px-3 sm:gap-2 sm:px-4"
          }`}
        >
          {navItems.map((item) => {
            const user = JSON.parse(localStorage.getItem("user"));
            if ( user?.roleName === "employee" 
            &&  (item.path === "/EmployeeManagement" || item.path === "/Departments" || item.path === "/AssignedTasks")) {
              return null; // Skip rendering this item for employees
            }
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={isDrawer ? close : undefined}
                title={isCollapsedRail ? item.label : undefined}
                className={`flex shrink-0 outline-none ${isCollapsedRail ? "flex w-full justify-center p-0" : "block w-full"}`}
              >
                {({ isActive }) =>
                  isCollapsedRail ? (
                    <span
                      className={`group flex h-10 w-10 items-center justify-center rounded-xl ui-transition sm:h-11 sm:w-11 ${
                        isActive
                          ? "border border-brand/35 bg-brand/15 text-brand shadow-none"
                          : "border border-transparent text-appSubtext hover:border-appBorder hover:bg-appMuted/80 hover:text-appText"
                      }`}
                    >
                      <Icon
                        size={17}
                        className="transition-transform duration-200 ease-out group-hover:scale-105 sm:size-[18px]"
                      />
                    </span>
                  ) : (
                    <span
                      className={`group flex items-center gap-2.5 rounded-2xl border px-2.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.05em] ui-transition sm:gap-3 sm:px-3 sm:py-3.5 sm:text-xs ${
                        isActive
                          ? "border-brand/35 bg-brand/15 text-brand"
                          : "border-transparent text-appSubtext hover:border-appBorder hover:bg-appMuted/80 hover:text-appText"
                      } ${isOpen || isDrawer ? "justify-start" : "justify-center"}`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ui-transition sm:h-9 sm:w-9 ${
                          isActive
                            ? "border-brand/30 bg-brand/10 text-brand"
                            : "border-appBorder/70 bg-appMuted/50 text-current group-hover:border-brand/25 group-hover:bg-brand/8"
                        }`}
                      >
                        <Icon
                          size={17}
                          className="transition-transform duration-200 ease-out group-hover:scale-105 sm:size-[18px]"
                        />
                      </span>
                      {(isOpen || isDrawer) && (
                        <span className="min-w-0 flex-1 truncate text-start">{item.label}</span>
                      )}
                    </span>
                  )
                }
              </NavLink>
            );
          })}
        </nav>

        <div
          className={`shrink-0 border-t border-appBorder ${
            isCollapsedRail
              ? "flex justify-center p-3"
              : "p-3 sm:p-4"
          }`}
        >
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsedRail ? "تسجيل الخروج" : undefined}
            className={`flex items-center rounded-2xl border border-red-500/20 text-red-500 ui-transition hover:bg-red-500/10 hover:border-red-500/40 ${
              isCollapsedRail
                ? "h-10 w-10 justify-center sm:h-11 sm:w-11"
                : "w-full justify-center gap-2 px-4 py-2.5 text-xs font-bold sm:py-3"
            }`}
          >
            <LogOut size={18} />

            {!isCollapsedRail && (
              <span>
                تسجيل الخروج
              </span>
            )}
          </button>
        </div>

        {isDrawer && isOpen && (
          <div className="shrink-0 border-t border-appBorder p-3 sm:p-4">
            <button
              type="button"
              onClick={close}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-appBorder px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-appSubtext ui-transition hover:bg-appMuted hover:text-appText sm:py-3"
            >
              <X size={18} /> إغلاق
            </button>
          </div>
        )}


      </aside>
    </div>
  );
}

export default Sidebar;
