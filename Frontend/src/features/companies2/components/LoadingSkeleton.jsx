export default function CompaniesLoadingSkeleton() {
  return (
    <div className="animate-fadeIn space-y-6" dir="rtl" aria-label="جاري تحميل الشركات">
      <div className="rounded-lg border border-appBorder bg-appSurface p-6 shadow-panel">
        <div className="h-4 w-28 rounded bg-appMuted" />
        <div className="mt-3 h-8 w-64 max-w-full rounded bg-appMuted" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-appMuted" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
            <div className="h-10 w-10 rounded-lg bg-appMuted" />
            <div className="mt-4 h-6 w-16 rounded bg-appMuted" />
            <div className="mt-2 h-3 w-20 rounded bg-appMuted" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="min-h-[188px] rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel">
            <div className="flex justify-between gap-4">
              <div className="w-full space-y-3">
                <div className="h-6 w-32 rounded bg-appMuted" />
                <div className="h-5 w-48 max-w-full rounded bg-appMuted" />
              </div>
              <div className="h-12 w-12 rounded-lg bg-appMuted" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="h-16 rounded-lg bg-appMuted" />
              <div className="h-16 rounded-lg bg-appMuted" />
              <div className="h-16 rounded-lg bg-appMuted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}