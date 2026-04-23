import { NavLink } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";
import {
  LayoutDashboard, Building, FileText, Users,
  ClipboardList, Building2, FileSignature, BookOpen,
  X, Settings, LifeBuoy, PlusCircle, ChevronRight, ChevronLeft
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
  const { isOpen, isMobile, isDesktop, isTablet, toggle, close } = useSidebar();

  // Desktop/Tablet: inline relative (pushes content)
  // Mobile: fixed overlay (slides over content)
  const sidebarWidth = isOpen ? 256 : 56; // 256px open, 56px collapsed
  const mobileSidebarWidth = isOpen ? 256 : 0; // 256px open, 0px hidden on mobile

  // Calculate actual width based on device
  const width = isMobile ? mobileSidebarWidth : sidebarWidth;

  return (
    <>
      {/* Sidebar - adapts based on device */}
      <aside
        style={{
          // Position: inline on desktop/tablet, fixed on mobile
          position: isMobile ? 'fixed' : 'relative',
          right: 0,
          top: 0,
          height: isMobile ? '100vh' : 'auto',
          
          // Width transitions
          width: `${width}px`,
          flexShrink: 0,
          
          // Transitions
          transition: 'width 0.3s ease-in-out',
          overflow: 'hidden',
          
          // Z-index: high on mobile (overlay), auto on desktop
          zIndex: isMobile ? 50 : 'auto',
          
          // Styling
          backgroundColor: '#f1f5f9', // appMuted
          borderRight: '1px solid #e2e8f0', // appBorder
        }}
        className="flex flex-col"
      >
        {/* Toggle button at top */}
        <div className="flex items-center justify-between h-16 px-3 shrink-0 border-b border-appBorder">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-appSubtext hover:bg-slate-200 hover:text-slate-800 transition-colors flex-shrink-0"
            title={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          {isOpen && !isMobile && (
            <div className="text-end flex-1 min-w-0">
              <h1 className="font-display text-lg font-black uppercase leading-none tracking-tight text-brandDeep truncate">المعمارية</h1>
            </div>
          )}
        </div>

        {/* Logo - show full or icon only (hidden on mobile when closed) */}
        {(isOpen || !isMobile) && (
          <div className="px-3 py-4 shrink-0 overflow-hidden whitespace-nowrap">
            {isOpen ? (
              <h1 className="font-display text-sm font-black uppercase leading-none tracking-tight text-brandDeep">السجل</h1>
            ) : (
              <div className="w-6 h-6 bg-brand rounded-lg" />
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-2 flex-1 space-y-1.5 px-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={isMobile ? close : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-semibold uppercase tracking-[0.1em] transition-all duration-200 ${
                    isActive
                      ? "bg-brand/10 text-brand border-r-2 border-brand"
                      : "text-appSubtext hover:bg-slate-200/50 hover:text-slate-800 border-r-2 border-transparent"
                  } ${
                    isOpen ? "justify-start" : "justify-center"
                  }`
                }
                title={!isOpen ? item.label : undefined}
              >
                <Icon size={18} className="transition-transform group-hover:scale-110 flex-shrink-0" />
                {isOpen && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Add button - always shows icon on collapsed */}
        <div className="p-2 shrink-0">
          <button
            className={`flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-brand to-brandDeep text-xs font-bold text-white shadow-panel hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] ${
              isOpen ? "w-full px-4 py-3" : "w-10 h-10"
            }`}
            title={!isOpen ? "Add new" : undefined}
          >
            <PlusCircle size={16} />
            {isOpen && <span>إدخال جديد</span>}
          </button>
        </div>

        {/* Settings and Help */}
        <div className={`border-t border-appBorder ${ isOpen ? "p-4 space-y-1" : "p-2 space-y-2" } shrink-0`}>
          <button
            className={`flex items-center gap-3 rounded-lg ${ isOpen ? "w-full px-4 py-2.5" : "w-10 h-10 justify-center" } text-xs font-semibold uppercase tracking-[0.1em] text-appSubtext hover:bg-slate-200/50 hover:text-slate-700 transition-colors`}
            title={!isOpen ? "Settings" : undefined}
          >
            <Settings size={18} />
            {isOpen && <span>الإعدادات</span>}
          </button>
          <button
            className={`flex items-center gap-3 rounded-lg ${ isOpen ? "w-full px-4 py-2.5" : "w-10 h-10 justify-center" } text-xs font-semibold uppercase tracking-[0.1em] text-appSubtext hover:bg-slate-200/50 hover:text-slate-700 transition-colors`}
            title={!isOpen ? "Help" : undefined}
          >
            <LifeBuoy size={18} />
            {isOpen && <span>الدعم</span>}
          </button>
        </div>

        {/* Mobile close button at bottom */}
        {isMobile && isOpen && (
          <div className="p-4 border-t border-appBorder">
            <button
              onClick={close}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-[0.1em] text-appSubtext hover:bg-slate-200/50 hover:text-slate-700 transition-colors"
            >
              <X size={18} /> إغلاق
            </button>
          </div>
        )}
      </aside>

      {/* Mobile overlay click handler */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={close}
          style={{ pointerEvents: 'auto' }}
        />
      )}
    </>
  );
}

export default Sidebar;



