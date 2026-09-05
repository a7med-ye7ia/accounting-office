import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Building2, GitBranch, Mail, Users } from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import { Avatar, StatusBadge, TableSkeleton } from "../../../shared/components/HrShared";
import { getBranchById } from "../../../api/branches";
import { fetchUsers } from "../../../api/users";
import { fetchCompanies } from "../../../api/companies";
import { getApiErrorMessage } from "../../../utils/apiError";

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

function matchesBranch(item, branch) {
  const itemId = item?.branchId ?? item?.branch?.id;
  const itemName = item?.branchName ?? item?.branch?.name;
  return String(itemId) === String(branch.id) || (itemName && itemName === branch.name);
}

function initials(name = "") { return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "؟"; }
function EmptyState({ children }) { return <div className="rounded-2xl border border-dashed border-appBorder px-4 py-10 text-center text-sm text-appSubtext">{children}</div>; }

export default function BranchReviewPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const { branchId } = useParams();
  const [branch, setBranch] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getBranchById(branchId), fetchUsers(), fetchCompanies()])
      .then(([branchResult, employeeResult, companyResult]) => {
        if (cancelled) return;

        if (branchResult.status === "fulfilled") {
          setBranch(branchResult.value);
        } else {
          setError(getApiErrorMessage(branchResult.reason, "تعذر تحميل بيانات الفرع."));
        }

        if (employeeResult.status === "fulfilled") {
          setEmployees(Array.isArray(employeeResult.value) ? employeeResult.value : []);
        }
        if (companyResult.status === "fulfilled") {
          setCompanies(Array.isArray(companyResult.value) ? companyResult.value : []);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [branchId]);

  const branchEmployees = useMemo(() => branch ? employees.filter((item) => matchesBranch(item, branch)) : [], [branch, employees]);
  const branchCompanies = useMemo(() => branch ? companies.filter((item) => matchesBranch(item, branch)) : [], [branch, companies]);

  if (user?.roleName?.toLowerCase() !== "owner") return <Navigate to="/Dashboard" replace />;

  return (
    <MainLayout title={branch ? branch.name : "مراجعة الفرع"} subtitle="الفروع / المراجعة" actions={<button type="button" onClick={() => navigate("/branches")} className="inline-flex items-center gap-2 rounded-xl border border-appBorder bg-appSurface px-4 py-2.5 text-sm font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand"><ArrowRight size={17} /> كل الفروع</button>}>
      {error ? <p role="alert" className="mb-6 rounded-2xl border border-danger/30 bg-badgeRedBg px-4 py-3 text-sm text-danger">{error}</p> : null}
      {loading ? (
        <div className="grid gap-6 xl:grid-cols-2" aria-busy="true" aria-label="جاري تحميل بيانات الفرع">
          <div className="h-72 rounded-3xl border border-appBorder bg-appSurface shadow-panel animate-pulse" />
          <div className="h-72 rounded-3xl border border-appBorder bg-appSurface shadow-panel animate-pulse" />
        </div>
      ) : null}
      {!loading && !branch ? <EmptyState>{error ? "تعذر تحميل هذا الفرع." : "هذا الفرع غير موجود."}</EmptyState> : null}
      {branch ? <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel"><GitBranch className="text-brand" size={20} /><p className="mt-5 text-xs font-bold text-appSubtext">الفرع</p><p className="mt-1 font-display text-xl font-extrabold text-appText">{branch.name}</p></div>
          <div className="rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel"><Users className="text-badgeBlueText" size={20} /><p className="mt-5 text-xs font-bold text-appSubtext">الموظفون</p><p className="mt-1 font-display text-2xl font-extrabold text-appText">{loading ? "—" : branchEmployees.length}</p></div>
          <div className="rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel"><Building2 className="text-success" size={20} /><p className="mt-5 text-xs font-bold text-appSubtext">الشركات</p><p className="mt-1 font-display text-2xl font-extrabold text-appText">{loading ? "—" : branchCompanies.length}</p></div>
        </section>
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-panel">
            <div className="border-b border-appBorder p-5"><h2 className="flex items-center gap-2 text-lg font-extrabold text-appText"><Users size={19} className="text-brand" /> الموظفون</h2><p className="mt-1 text-sm text-appSubtext">الموظفون المسندون إلى هذا الفرع</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-sm"><thead className="table-head-surface"><tr><th className="px-5 py-3 text-start text-xs text-appSubtext">الموظف</th><th className="px-5 py-3 text-start text-xs text-appSubtext">القسم</th><th className="px-5 py-3 text-start text-xs text-appSubtext">الحالة</th></tr></thead>{loading ? <TableSkeleton rows={4} cols={3} /> : <tbody className="divide-y divide-appBorder/80">{branchEmployees.map((employee) => <tr key={employee.id} className="table-row-interactive"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar initials={initials(employee.fullName)} /><div><p className="font-bold text-appText">{employee.fullName}</p><p className="mt-1 flex items-center gap-1 text-xs text-appSubtext"><Mail size={12} />{employee.email}</p></div></div></td><td className="px-5 py-4 text-appSubtext">{employee.departmentName || employee.department?.name || "—"}</td><td className="px-5 py-4"><StatusBadge status={employee.status || "ACTIVE"} /></td></tr>)}{branchEmployees.length === 0 ? <tr><td colSpan={3} className="px-5 py-10"><EmptyState>لا يوجد موظفون مسندون إلى هذا الفرع.</EmptyState></td></tr> : null}</tbody>}</table></div>
          </section>
          <section className="overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-panel">
            <div className="border-b border-appBorder p-5"><h2 className="flex items-center gap-2 text-lg font-extrabold text-appText"><Building2 size={19} className="text-success" /> الشركات</h2><p className="mt-1 text-sm text-appSubtext">الشركات المسندة إلى هذا الفرع</p></div>
            <div className="divide-y divide-appBorder/80">{loading ? <div className="p-5"><TableSkeleton rows={4} cols={2} /></div> : branchCompanies.length === 0 ? <div className="p-5"><EmptyState>لا توجد شركات مسندة إلى هذا الفرع.</EmptyState></div> : branchCompanies.map((company) => <div key={company.id} className="flex items-center gap-3 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success"><Building2 size={18} /></span><div><p className="font-bold text-appText">{company.name}</p><p className="mt-1 text-xs text-appSubtext">{company.companyType || "شركة"}</p></div></div>)}</div>
          </section>
        </div>
      </div> : null}
    </MainLayout>
  );
}