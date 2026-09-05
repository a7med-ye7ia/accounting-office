import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  Building,
  ListTodo,
  UserCheck,
  GitBranch,
  FileSignature,
  Clock,
  AlertCircle,
} from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import { PageStatCard } from "../../../shared/components/HrShared";
import { fetchUsers } from "../../../api/users";
import { fetchDepartments } from "../../../api/departments";
import { fetchBranches } from "../../../api/branches";
import { fetchRoles } from "../../../api/roles";
import { fetchCompanies } from "../../../api/companies";
import { fetchTasks } from "../../../api/tasks";
import { fetchContracts } from "../../../api/contracts";
import { getApiErrorMessage } from "../../../utils/apiError";
import {
  formatTaskStatusAr,
  formatContractStatusAr,
  formatContractTypeAr,
  formatDateTimeShort,
  dateValueToMs,
} from "../../../utils/dashboardFormat";
import { isOwner } from "../../../utils/roles";

function asArray(v) {
  return Array.isArray(v) ? v : [];
}

function isActiveCompany(c) {
  if (c?.deletedAt != null) return false;
  const st = c?.status;
  return st == null || st === "ACTIVE";
}

function isActiveContract(c) {
  return c?.deletedAt == null;
}

function DashboardPage() {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const isOwner = currentUser?.roleName?.toLowerCase() === "owner";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [contracts, setContracts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [u, d, b, r, co, t, ct] = await Promise.all([
          fetchUsers(),
          fetchDepartments(),
          fetchBranches(),
          fetchRoles(),
          fetchCompanies(),
          fetchTasks(),
          fetchContracts(),
        ]);
        if (cancelled) return;
        setUsers(asArray(u));
        setDepartments(asArray(d));
        setBranches(asArray(b));
        setRoles(asArray(r));
        setCompanies(asArray(co));
        setTasks(asArray(t));
        setContracts(asArray(ct));
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "تعذر تحميل بيانات لوحة التحكم."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      return null;
    }
  })();

  const displayedUsers = useMemo(() => {
    if (isOwner(currentUser)) return users;
    return users.filter((u) => !isOwner(u) && (!u.roleName || u.roleName.toLowerCase() !== 'owner'));
  }, [users, currentUser]);

  const metrics = useMemo(() => {
    const activeUsers = displayedUsers.filter((x) => x.status === "ACTIVE").length;
    const activeCompanies = companies.filter(isActiveCompany).length;
    const liveContracts = contracts.filter(isActiveContract);
    const openTasks = tasks.filter(
      (x) => x.status === "PENDING" || x.status === "IN_PROGRESS",
    );
    const pendingContracts = liveContracts.filter((x) => x.status === "PENDING_APPROVAL").length;
    const now = Date.now();
    const overdueTasks = tasks.filter((x) => {
      if (x.status === "DONE" || !x.dueDate) return false;
      const ms = dateValueToMs(x.dueDate);
      return ms > 0 && ms < now;
    }).length;
    const usersWithDept = displayedUsers.filter((x) => x.departmentId != null).length;
    const usersMissingDept = displayedUsers.length - usersWithDept;

    const recentTasks = [...tasks]
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 6);

    const recentContracts = [...liveContracts]
      .sort((a, b) => dateValueToMs(b.createdAt) - dateValueToMs(a.createdAt))
      .slice(0, 6);

    return {
      usersTotal: displayedUsers.length,
      activeUsers,
      usersMissingDept,
      departmentsTotal: departments.length,
      branchesTotal: branches.length,
      rolesTotal: roles.length,
      companiesTotal: activeCompanies,
      tasksTotal: tasks.length,
      openTasksCount: openTasks.length,
      overdueTasks,
      contractsTotal: liveContracts.length,
      pendingContracts,
      recentTasks,
      recentContracts,
    };
  }, [displayedUsers, departments, branches, roles, companies, tasks, contracts]);

  const tableShell =
    "overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-raise";

  return (
    <MainLayout title="لوحة تحكم " subtitle="  ">
      <div className="space-y-8 lg:space-y-10">
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-badgeRedBg/25 px-4 py-3 text-sm text-appText shadow-inner"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-appBorder bg-appSurface px-3 py-1.5 text-xs font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand"
            >
              إعادة التحميل
            </button>
          </div>
        )}

        {/* Row A — primary volumes */}
        <section aria-label="مؤشرات رئيسية">
          {/* <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-appSubtext">
            الصف أ — الحجم والنطاق
          </h2> */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <PageStatCard
              icon={Users}
              label="إجمالي المستخدمين"
              value={metrics.usersTotal}
              colorClass="bg-badgeBlueBg text-badgeBlueText"
              loading={loading}
            />
            <PageStatCard
              icon={Building2}
              label="الأقسام"
              value={metrics.departmentsTotal}
              colorClass="bg-badgePurpleBg text-badgePurpleText"
              loading={loading}
            />
            <PageStatCard
              icon={Building}
              label="الشركات النشطة"
              value={metrics.companiesTotal}
              colorClass="bg-success/15 text-success"
              loading={loading}
            />
            <PageStatCard
              icon={ListTodo}
              label="المهام (الكل)"
              value={metrics.tasksTotal}
              colorClass="bg-badgeGrayBg text-badgeGrayText"
              loading={loading}
            />
          </div>
        </section>

        {/* Row B — health & pipeline */}
        <section aria-label="مؤشرات الصحة">
          {/* <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-appSubtext">
            الصف ب — النشاط والالتزام
          </h2> */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <PageStatCard
              icon={UserCheck}
              label="مستخدمون نشطون"
              value={metrics.activeUsers}
              colorClass="bg-success/15 text-success"
              loading={loading}
            />
            {isOwner ? (
              <Link to="/branches" className="block rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
                <PageStatCard
                  icon={GitBranch}
                  label="الفروع"
                  value={metrics.branchesTotal}
                  colorClass="bg-badgeBlueBg text-badgeBlueText"
                  loading={loading}
                />
              </Link>
            ) : null}
            <PageStatCard
              icon={FileSignature}
              label="عقود بانتظار الموافقة"
              value={metrics.pendingContracts}
              colorClass="bg-badgePurpleBg text-badgePurpleText"
              loading={loading}
            />
            <PageStatCard
              icon={Clock}
              label="مهام مفتوحة"
              value={metrics.openTasksCount}
              colorClass="bg-badgeGrayBg text-badgeGrayText"
              loading={loading}
            />
          </div>
          {/* <p className="mt-3 text-xs leading-relaxed text-appSubtext">
            «مستخدمون بلا قسم» (حاليًا{" "}
            <span className="font-mono text-brand">{metrics.usersMissingDept}</span>
            ) يعتمد على وجود <span className="font-mono">departmentId</span> في استجابة المستخدمين. مهام
            متأخرة:{" "}
            <span className="font-mono text-brand">{metrics.overdueTasks}</span> — أدوار النظام:{" "}
            <span className="font-mono text-brand">{metrics.rolesTotal}</span> — عقود نشطة (غير محذوفة):{" "}
            <span className="font-mono text-brand">{metrics.contractsTotal}</span>.
          </p> */}
        </section>

        {/* Row C — recent activity */}
        <section aria-label="النشاط الأخير">
          {/* <h2 className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-appSubtext">
            الصف ج — آخر النشاط
          </h2> */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className={tableShell}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-appBorder px-5 py-4 sm:px-6">
                <h3 className="text-sm font-semibold text-appText">آخر المهام</h3>
                <Link
                  to="/EmployeeTasks"
                  className="text-xs font-bold text-brand ui-transition hover:text-brandDeep"
                >
                  عرض الكل →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-sm">
                  <thead className="table-head-surface">
                    <tr>
                      {["العنوان", "الحالة", "المعيّن إليه", "الموعد"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-start text-[10px] font-extrabold uppercase tracking-[0.14em] text-appSubtext sm:px-5"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-appBorder/80">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-appSubtext">
                          جاري التحميل…
                        </td>
                      </tr>
                    ) : metrics.recentTasks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-appSubtext">
                          لا توجد مهام لعرضها.
                        </td>
                      </tr>
                    ) : (
                      metrics.recentTasks.map((row) => (
                        <tr key={row.id} className="table-row-interactive">
                          <td className="px-4 py-3 text-start font-medium text-appText sm:px-5" dir="auto">
                            {row.title}
                          </td>
                          <td className="px-4 py-3 text-start text-appSubtext sm:px-5">
                            {formatTaskStatusAr(row.status)}
                          </td>
                          <td className="px-4 py-3 text-start text-appSubtext sm:px-5" dir="auto">
                            {row.assignedToName || "—"}
                          </td>
                          <td className="px-4 py-3 text-start text-appSubtext sm:px-5">
                            {formatDateTimeShort(row.dueDate)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={tableShell}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-appBorder px-5 py-4 sm:px-6">
                <h3 className="text-sm font-semibold text-appText">آخر العقود</h3>
                <Link
                  to="/ContractAi"
                  className="text-xs font-bold text-brand ui-transition hover:text-brandDeep"
                >
                  عرض الكل →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[320px] text-sm">
                  <thead className="table-head-surface">
                    <tr>
                      {["النوع", "الحالة", "الشركة", "تاريخ الإنشاء"].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-start text-[10px] font-extrabold uppercase tracking-[0.14em] text-appSubtext sm:px-5"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-appBorder/80">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-appSubtext">
                          جاري التحميل…
                        </td>
                      </tr>
                    ) : metrics.recentContracts.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-appSubtext">
                          لا توجد عقود لعرضها.
                        </td>
                      </tr>
                    ) : (
                      metrics.recentContracts.map((row) => (
                        <tr key={row.id} className="table-row-interactive">
                          <td className="px-4 py-3 text-start text-appSubtext sm:px-5">
                            {formatContractTypeAr(row.type)}
                          </td>
                          <td className="px-4 py-3 text-start text-appSubtext sm:px-5">
                            {formatContractStatusAr(row.status)}
                          </td>
                          <td
                            className="px-4 py-3 text-start font-medium text-appText sm:px-5"
                            dir="auto"
                          >
                            {row.company?.name || "—"}
                          </td>
                          <td className="px-4 py-3 text-start text-appSubtext sm:px-5">
                            {formatDateTimeShort(row.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;
