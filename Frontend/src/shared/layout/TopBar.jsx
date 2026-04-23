import { Menu, Search, Bell, Inbox } from "lucide-react";
import useSidebar from "../hooks/useSidebar";

function TopBar() {
  const { toggle, isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-appBorder bg-appSurface px-4 lg:px-6">
      <div className="flex items-center w-full max-w-xl gap-4">
        {/* Hamburger for mobile only */}
        {isMobile && (
          <button 
            onClick={toggle}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
          >
            <Menu size={20} />
          </button>
        )}

        <div className="relative w-full max-w-sm hidden sm:block" dir="rtl">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg bg-appMuted pr-9 pl-4 py-2 text-xs font-medium text-appText outline-none ring-brand focus:ring-2 transition-all placeholder:text-slate-400"
            placeholder="Search accounts, companies..."
            type="text"
          />
        </div>
      </div>

      <div className="mr-4 flex items-center gap-3 lg:gap-4 shrink-0">
        <button className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative">
           <Bell size={18} />
           <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-danger border-2 border-white"></span>
        </button>
        <button className="hidden sm:flex p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
           <Inbox size={18} />
        </button>
        
        <div className="hidden sm:block h-6 w-px bg-appBorder" />
        
        <button className="hidden sm:inline-flex rounded-lg bg-gradient-to-b from-brand to-brandDeep px-4 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:shadow-md transition-shadow">
          Add New
        </button>
        
        <div className="flex items-center gap-2 pr-1 sm:pr-2">
           <span className="text-xs font-semibold text-appText hidden md:block">Admin User</span>
           <div className="h-8 w-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-bold text-xs shrink-0">
             AD
           </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
