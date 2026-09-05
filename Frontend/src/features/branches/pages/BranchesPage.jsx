import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ChevronLeft, GitBranch, MapPin, Phone, Building2 } from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import { CardSkeleton } from "../../../shared/components/HrShared";
import { fetchBranches } from "../../../api/branches";
import { getApiErrorMessage } from "../../../utils/apiError";

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

export default function BranchesPage() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchBranches()
      .then((data) => { if (!cancelled) setBranches(Array.isArray(data) ? data : []); })
      .catch((err) => { if (!cancelled) setError(getApiErrorMessage(err, "تعذر تحميل الفروع.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (user?.roleName?.toLowerCase() !== "owner") return <Navigate to="/Dashboard" replace />;

  return (
    <MainLayout title="مراجعة الفروع" subtitle="الفروع">
      <section className="overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-raise">
        <div className="flex flex-col gap-5 border-b border-appBorder bg-gradient-to-l from-brand/10 via-appSurface to-appSurface p-5 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand"><GitBranch size={21} /></div>
            <h2 className="font-display text-2xl font-extrabold text-appText sm:text-3xl">اختر فرعًا للمراجعة</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-appSubtext">راجع الموظفين والشركات المرتبطين بكل فرع في صفحة مستقلة.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-badgePurpleBg px-3 py-2 text-xs font-bold text-badgePurpleText"><Building2 size={15} /> وصول المالك فقط</span>
        </div>
        <div className="p-5 sm:p-7">
          {error ? <p role="alert" className="mb-5 rounded-2xl border border-danger/30 bg-badgeRedBg px-4 py-3 text-sm text-danger">{error}</p> : null}
          {loading ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><CardSkeleton count={6} /></div> : branches.length === 0 ? <div className="rounded-2xl border border-dashed border-appBorder px-5 py-12 text-center text-sm text-appSubtext">لا توجد فروع مسجلة.</div> : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {branches.map((branch) => (
                <button key={branch.id} type="button" onClick={() => navigate(`/branches/${branch.id}/review`)} className="group flex min-h-[190px] flex-col rounded-2xl border border-appBorder bg-appMuted/35 p-5 text-start shadow-panel ui-transition hover:-translate-y-1 hover:border-brand/40 hover:bg-appSurface hover:shadow-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-badgeBlueBg text-badgeBlueText"><GitBranch size={20} /></span>
                  <span className="mt-5 line-clamp-2 font-display text-lg font-extrabold text-appText">{branch.name || "فرع بدون اسم"}</span>
                  <span className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-5 text-xs text-appSubtext">
                    {branch.address ? <span className="inline-flex items-center gap-1"><MapPin size={14} />{branch.address}</span> : null}
                    {branch.phone ? <span className="inline-flex items-center gap-1"><Phone size={14} />{branch.phone}</span> : null}
                  </span>
                  <span className="mt-4 flex items-center justify-between border-t border-appBorder pt-3 text-xs font-bold text-brand">فتح المراجعة <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" /></span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}