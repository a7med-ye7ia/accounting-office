import useSidebar from "../hooks/useSidebar";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

function MainLayout({ title, subtitle, actions, children }) {
  const { isOpen, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-appBg text-appText flex flex-row-reverse overflow-hidden w-full" dir="rtl">
      {/* SIDEBAR - on the right, pushes content on desktop/tablet */}
      <Sidebar />
      
      {/* MAIN CONTENT - takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <TopBar />
        
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-full overflow-auto">
          {/* Header Row */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              {subtitle && (
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-appSubtext mb-1">
                  {subtitle}
                </p>
              )}
              <h1 className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold leading-none text-appText" dir="ltr" style={{ textAlign: 'left' }}>
                {title}
              </h1>
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
          
          {/* Main Context container */}
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
