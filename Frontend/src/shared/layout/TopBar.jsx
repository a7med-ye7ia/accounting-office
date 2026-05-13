import { Menu, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";
import { useTheme } from "../../context/ThemeContext.jsx";

function TopBar() {
  const { toggle, isOpen, isDesktop } = useSidebar();
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
              aria-expanded={isOpen}
              aria-controls="app-sidebar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-appBorder bg-appMuted/80 text-appText ui-transition hover:border-brand/40 hover:bg-brand/10 hover:text-brand active:scale-95"
              aria-label={isOpen ? "إغلاق القائمة" : "فتح القائمة"}
            >
              <Menu size={20} />
            </button>
          )}
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

          </div>

          <div className="flex items-center gap-3 border-s border-appBorder ps-3 sm:ps-4">
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
