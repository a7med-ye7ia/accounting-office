import { Menu, Search, Bell, Inbox, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";
import { useTheme } from "../../context/ThemeContext.jsx";

function TopBar() {
  const { toggle, isDesktop } = useSidebar();
  const showNavMenu = !isDesktop;
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="z-30 shrink-0 border-b border-appBorder bg-appSurface/70 backdrop-blur-2xl backdrop-saturate-150">
      <div className="flex h-[4.25rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
          {showNavMenu && (
            <button
              type="button"
              onClick={toggle}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-appBorder bg-appMuted/80 text-appText ui-transition hover:border-brand/40 hover:bg-brand/10 hover:text-brand active:scale-95"
              aria-label="فتح القائمة"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-md lg:max-w-lg" dir="rtl">
            <Search
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 z-[1] -translate-y-1/2 text-appSubtext"
            />
            <input
              className="h-11 w-full rounded-2xl border border-appBorder bg-appMuted/90 pr-12 pl-4 text-sm font-medium text-appText shadow-inner placeholder:text-appSubtext/75 ui-transition hover:border-appBorder hover:bg-appSurface focus:border-brand focus:bg-appSurface focus:shadow-panel"
              placeholder="بحث في الحسابات والشركات..."
              type="search"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden h-9 w-px bg-appBorder sm:block" aria-hidden />

          <div className="flex items-center gap-1 rounded-2xl border border-appBorder bg-appMuted/50 p-1 sm:p-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-appSubtext ui-transition hover:bg-appSurface hover:text-brand hover:shadow-sm"
              title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
              aria-label={theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن"}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-appSubtext ui-transition hover:bg-appSurface hover:text-appText hover:shadow-sm"
              aria-label="الإشعارات"
            >
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-appSurface" />
            </button>
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-xl text-appSubtext ui-transition hover:bg-appSurface hover:text-appText hover:shadow-sm sm:flex"
              aria-label="صندوق الوارد"
            >
              <Inbox size={18} />
            </button>
          </div>

          <button
            type="button"
            className="hidden h-11 shrink-0 items-center rounded-2xl bg-gradient-to-b from-brand to-brandDeep px-5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-panel ui-transition hover:brightness-110 active:scale-[0.97] sm:inline-flex"
          >
            إضافة
          </button>

          <div className="ms-1 flex items-center gap-3 border-s border-appBorder ps-3 sm:ps-4">
            <span className="hidden max-w-[8rem] truncate text-xs font-semibold text-appText md:block">
              مسؤول النظام
            </span>
            <Link
              to="/profile/1"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-appBorder bg-gradient-to-br from-brand/20 to-brandDeep/10 text-sm font-bold text-brand shadow-sm ui-transition hover:border-brand/50 hover:from-brand/30 hover:shadow-panel active:scale-95"
            >
              AD
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
