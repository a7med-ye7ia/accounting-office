import MainLayout from "../../../shared/layout/MainLayout";

function DashboardPage() {
  return (
    <MainLayout title="لوحة تحكم العمليات" subtitle="مصفوفة النظرة العامة">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 rounded-2xl bg-appSurface p-7 lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-appSubtext">إجمالي الشركات</p>
          <p className="mt-3 font-display text-6xl font-extrabold text-brand">1,284</p>
          <p className="mt-6 text-base font-semibold text-success">+12% من الشهر الماضي</p>
        </div>
        <div className="col-span-12 rounded-2xl bg-appSurface p-7 lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-appSubtext">العقود النشطة</p>
          <p className="mt-3 font-display text-6xl font-extrabold text-appText">842</p>
          <div className="mt-8 flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-appBorder">
              <div className="h-1.5 w-3/4 rounded-full bg-indigo-700" />
            </div>
            <p className="text-xs font-semibold text-appSubtext">75%</p>
          </div>
        </div>
        <div className="col-span-12 rounded-2xl bg-appSurface p-7 lg:col-span-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-appSubtext">المهام المعلقة</p>
          <p className="mt-3 font-display text-6xl font-extrabold text-danger">14</p>
          <p className="mt-6 inline-flex rounded-full bg-badgeRedBg px-3 py-1 text-xs font-semibold text-badgeRedText">يتطلب اهتماماً</p>
        </div>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;

