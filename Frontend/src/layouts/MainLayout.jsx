import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

function MainLayout({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen bg-appBg text-appText flex overflow-x-hidden w-full max-w-[100vw]">
      {/* Sidebar handles its own responsive fixed positioning */}
      <Sidebar />
      
      {/* Main Content Area - padded left on large screens to accommodate the fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 lg:pl-64 w-full">
        <TopBar />
        
        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-full overflow-hidden">
          {/* Header Row */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              {subtitle && (
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-appSubtext mb-1">
                  {subtitle}
                </p>
              )}
              <h1 className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold leading-none text-appText">
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
