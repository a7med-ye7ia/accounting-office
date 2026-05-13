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
  X,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { label: "لوحة التحكم", path: "/Dashboard", icon: LayoutDashboard },
  { label: "الشركات", path: "/CompaniesDirectory", icon: Building },
  { label: "المستندات", path: "/Documents", icon: FileText },
  { label: "الموظفون", path: "/EmployeeManagement", icon: Users },
  { label: "مهام الموظفين", path: "/EmployeeTasks", icon: ClipboardList },
  { label: "الأقسام", path: "/Departments", icon: Building2 },
  { label: "العقود", path: "/ContractAi", icon: FileSignature },
  { label: "السجل", path: "/EquilibriumLedger", icon: BookOpen },
];

function Sidebar() {
  const { isOpen, isMobile, isTablet, toggle, close } = useSidebar();

  /** Drawer overlay for small + medium viewports; fixed rail on large desktop */
  const isDrawer = isMobile || isTablet;

  const desktopWidth = isOpen ? 280 : 72;
  const drawerWidthOpen = 288;
  const width = isDrawer ? (isOpen ? drawerWidthOpen : 0) : desktopWidth;

  return (
    <div className="relative flex h-full min-h-0 shrink-0 self-stretch">
      <aside
        style={{
          position: isDrawer ? "fixed" : "relative",
          right: 0,
          top: 0,
          width: `${width}px`,
          flexShrink: 0,
          transition: "width 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: isDrawer ? 50 : "auto",
        }}
        className={`flex shrink-0 flex-col overflow-hidden rounded-3xl border border-appBorder bg-appSurface/85 shadow-raise backdrop-blur-2xl backdrop-saturate-150 ${
          isDrawer ? "h-[100dvh] max-h-[100dvh]" : "h-full min-h-0 max-h-full self-stretch"
        }`}
      >
        <div className="flex h-[3.75rem] shrink-0 items-center gap-2 border-b border-appBorder px-3 sm:h-14 sm:px-4">
          <button
            type="button"
            onClick={toggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-transparent text-appSubtext ui-transition hover:border-appBorder hover:bg-appMuted hover:text-brand active:scale-95 sm:h-11 sm:w-11"
            title={isOpen ? "طي القائمة" : "توسيع القائمة"}
          >
            {isOpen ? <ChevronRight size={20} aria-hidden /> : <ChevronLeft size={20} aria-hidden />}
          </button>

          {!isDrawer && isOpen && (
            <div className="min-w-0 flex-1 text-end">
              <span className="font-display block truncate text-lg font-black tracking-tight text-brand">
                المحاسبة
              </span>
              <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-appSubtext">
                Accounting Office
              </span>
            </div>
          )}

          {!isDrawer && !isOpen && (
            <div className="flex min-w-0 flex-1 justify-center">
              <span
                className="font-display flex h-10 w-10 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 text-sm font-black text-brand"
                aria-hidden
              >
                مح
              </span>
            </div>
          )}

          {isDrawer && isOpen && (
            <div className="min-w-0 flex-1 text-end">
              <span className="font-display block truncate text-lg font-black tracking-tight text-brand">
                المحاسبة
              </span>
            </div>
          )}
        </div>

        <nav className="mt-1 flex min-h-0 flex-1 flex-col justify-start gap-1.5 overflow-hidden px-3 pb-3 pt-2 sm:gap-2 sm:px-4 sm:pb-4 sm:pt-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={isDrawer ? close : undefined}
                title={!isOpen && !isDrawer ? item.label : undefined}
                className="block w-full shrink-0 outline-none"
              >
                {({ isActive }) => (
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
                )}
              </NavLink>
            );
          })}
        </nav>

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

      {isDrawer && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-appText/50 backdrop-blur-md ui-transition"
          onClick={close}
          style={{ pointerEvents: "auto" }}
          aria-hidden
        />
      )}
    </div>
  );
}

export default Sidebar;
