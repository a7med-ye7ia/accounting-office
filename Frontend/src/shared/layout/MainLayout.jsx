import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

function MainLayout({ title, subtitle, actions, children }) {
  return (
    <div
      className="app-shell flex h-screen max-h-[100dvh] min-h-0 w-full flex-row gap-2 overflow-hidden bg-appBg px-2 text-appText sm:gap-4 sm:px-4 md:gap-6 md:px-7"
      dir="rtl"
    >
      <Sidebar />

      <div className="app-content-dock flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl md:rounded-3xl">
        <TopBar />

        <main className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth">
          <div className="mx-auto w-full max-w-[1720px] px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-12">
            <header className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="min-w-0 flex-1 text-start">
                <nav
                  className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-appSubtext"
                  aria-label="مسار التنقل"
                >
                  <Link
                    to="/Dashboard"
                    className="font-medium ui-transition hover:text-brand"
                  >
                    لوحة التحكم
                  </Link>
                  {subtitle ? (
                    <>
                      <span className="text-appBorder" aria-hidden>
                        /
                      </span>
                      <span>{subtitle}</span>
                    </>
                  ) : null}
                </nav>
                <h1
                  className="font-display text-3xl font-extrabold leading-tight tracking-tight text-appText sm:text-4xl lg:text-5xl"
                  dir="auto"
                >
                  {title}
                </h1>
              </div>
              {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-3 sm:pb-0.5">{actions}</div>
              )}
            </header>

            <div className="space-y-8 lg:space-y-10 animate-fadeIn">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
