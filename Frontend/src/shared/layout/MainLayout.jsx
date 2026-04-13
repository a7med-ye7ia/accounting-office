import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

function MainLayout({ title, subtitle, actions, children }) {
  return (
    <div className="min-h-screen bg-appBg text-appText">
      <Sidebar />
      <div className="lg:ml-64">
        <TopBar />
        <main className="p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-appSubtext">{subtitle}</p>
              <h1 className="mt-1 font-display text-5xl font-extrabold leading-none">{title}</h1>
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
