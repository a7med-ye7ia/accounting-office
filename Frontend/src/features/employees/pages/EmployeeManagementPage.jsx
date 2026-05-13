import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  ChevronDown,
  Building2,
  AlertCircle,
  Loader2,
  UserCheck,
  PauseCircle,
} from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import { Modal, PageStatCard } from "../../../shared/components/HrShared";
import EmployeeTableRow from "../ui/EmployeeTableRow";
import { fetchDepartments } from "../../../api/departments";
import { fetchBranches } from "../../../api/branches";
import { fetchRoles } from "../../../api/roles";
import { fetchUsers, addUser, updateUser, deleteUser } from "../../../api/users";
import { toDateInputValue } from "../../../utils/dateFormat";
import { getApiErrorMessage } from "../../../utils/apiError";

const UI_MAP = {
  owner: "صاحب العمل",
  headBranch: "مدير فرع",
  headDepartment: "رئيس قسم",
  employee: "موظف",
  "Human Resources": "الموارد البشرية",
  Finance: "المحاسبة",
  Operations: "تكنولوجيا المعلومات",
  Sales: "المبيعات",
};

const EMPTY_EMP = {
  name: "",
  nationalId: "",
  roleId: "",
  departmentId: "",
  email: "",
  branchId: "",
  phone: "",
  hireDate: "",
  status: "نشط",
};

const DEPT_FILTER_ALL = "all";
const STATUS_FILTER_ALL = "all";

function translate(key) {
  return UI_MAP[key] || key;
}

function inputCls(invalid) {
  return [
    "w-full rounded-2xl border bg-appMuted/80 px-3 py-2.5 text-sm font-medium text-appText shadow-inner",
    "placeholder:text-appSubtext/70 ui-transition",
    "hover:border-brand/25 hover:bg-appSurface/90",
    "focus:border-brand focus:bg-appSurface focus:outline-none focus:ring-2 focus:ring-brand/25",
    invalid ? "border-danger/60 ring-1 ring-danger/20" : "border-appBorder",
  ].join(" ");
}

/** Maps API enum to labels expected by {@link StatusBadge} in `HrShared`. */
function statusToBadgeLabel(statusEn) {
  const s = typeof statusEn === "string" ? statusEn : "";
  if (s === "ACTIVE") return "نشط";
  if (s === "SUSPENDED") return "في إجازة";
  if (s === "RESIGNED") return "منتهي الخدمة";
  return "نشط";
}

function mapStatusToEnum(arabicStatus) {
  switch (arabicStatus) {
    case "نشط":
      return "ACTIVE";
    case "في إجازة":
      return "SUSPENDED";
    case "منتهي الخدمة":
      return "RESIGNED";
    default:
      return "ACTIVE";
  }
}

function getDisplayRole(emp, roles) {
  if (emp.roleName) return translate(emp.roleName);
  if (emp.role && emp.role.name) return translate(emp.role.name);
  const targetId = emp.roleId || (emp.role && emp.role.id);
  if (targetId) {
    const roleObj = roles.find((r) => String(r.id) === String(targetId));
    if (roleObj) return translate(roleObj.name);
  }
  return "—";
}

function getDisplayDept(emp, departments) {
  if (emp.departmentName) return translate(emp.departmentName);
  if (emp.department && emp.department.name) return translate(emp.department.name);
  const targetId = emp.departmentId || (emp.department && emp.department.id);
  if (targetId) {
    const deptObj = departments.find((d) => String(d.id) === String(targetId));
    if (deptObj) return translate(deptObj.name);
  }
  return "—";
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function EmployeeManagementPage() {
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(DEPT_FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(EMPTY_EMP);
  const [deleteId, setDeleteId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);

  const loadData = async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [deptData, empData, branchData, roleData] = await Promise.all([
        fetchDepartments(),
        fetchUsers(),
        fetchBranches(),
        fetchRoles(),
      ]);
      setDepartments(Array.isArray(deptData) ? deptData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
      setRoles(Array.isArray(roleData) ? roleData : []);
    } catch (e) {
      setLoadError(getApiErrorMessage(e, "تعذر تحميل بيانات الموظفين."));
      setDepartments([]);
      setEmployees([]);
      setBranches([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const name = (e.fullName || e.name || "").toLowerCase();
      const email = (e.email || "").toLowerCase();
      const matchName = !q || name.includes(q) || email.includes(q);
      const matchDept =
        deptFilter === DEPT_FILTER_ALL ||
        (e.departmentId != null && String(e.departmentId) === String(deptFilter));
      const st = typeof e.status === "string" ? e.status : "";
      const matchStatus = statusFilter === STATUS_FILTER_ALL || st === statusFilter;
      return matchName && matchDept && matchStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const openCreate = () => {
    setForm(EMPTY_EMP);
    setEditEmp(null);
    setFieldErrors({});
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (emp) => {
    setForm({
      name: emp.fullName || "",
      nationalId: emp.nationalId || "",
      email: emp.email || "",
      phone: emp.phone || "",
      hireDate: toDateInputValue(emp.hireDate),
      status: statusToBadgeLabel(emp.status),
      departmentId: emp.departmentId != null ? String(emp.departmentId) : "",
      branchId: emp.branchId != null ? String(emp.branchId) : "",
      roleId: emp.roleId != null ? String(emp.roleId) : "",
    });
    setEditEmp(emp);
    setFieldErrors({});
    setFormError(null);
    setShowForm(true);
  };

  const validateForm = () => {
    const err = {};
    if (!form.name.trim()) err.name = true;
    if (!form.email.trim()) err.email = true;
    else if (!isValidEmail(form.email)) err.emailFormat = true;
    const hasDept = !!form.departmentId;
    const hasBranch = !!form.branchId;
    if (hasDept !== hasBranch) err.assignment = true;
    setFieldErrors(err);
    if (Object.keys(err).length) {
      if (err.emailFormat) setFormError("صيغة البريد الإلكتروني غير صحيحة.");
      else if (err.assignment) setFormError("اختر القسم والفرع معًا لتسجيل التعيين، أو اتركهما فارغين معًا.");
      else setFormError("يرجى تعبئة الحقول المطلوبة.");
      return false;
    }
    setFormError(null);
    return true;
  };

  const buildPayload = () => ({
    fullName: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone?.trim() || null,
    nationalId: form.nationalId?.trim() || null,
    hireDate: form.hireDate || null,
    status: mapStatusToEnum(form.status),
    departmentId: form.departmentId ? Number(form.departmentId) : null,
    branchId: form.branchId ? Number(form.branchId) : null,
    roleId: form.roleId ? Number(form.roleId) : null,
  });

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaveSubmitting(true);
    setFormError(null);
    try {
      const userData = buildPayload();
      if (editEmp) {
        await updateUser(editEmp.id, userData);
        setBanner({ type: "success", text: "تم تحديث بيانات الموظف." });
      } else {
        await addUser(userData);
        setBanner({ type: "success", text: "تمت إضافة الموظف." });
      }
      setShowForm(false);
      setEditEmp(null);
      await loadData();
    } catch (e) {
      setFormError(getApiErrorMessage(e, "تعذر حفظ البيانات."));
    } finally {
      setSaveSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteSubmitting(true);
    try {
      await deleteUser(deleteId);
      setBanner({ type: "success", text: "تم حذف الموظف." });
      setDeleteId(null);
      await loadData();
    } catch (e) {
      setBanner({
        type: "error",
        text: getApiErrorMessage(e, "تعذر حذف الموظف."),
      });
      setDeleteId(null);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const activeCount = employees.filter((e) => e.status === "ACTIVE").length;
  const leaveCount = employees.filter((e) => e.status === "SUSPENDED").length;

  return (
    <MainLayout
      title="دليل الموظفين"
      subtitle="الموارد البشرية"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-brand to-brandDeep px-4 py-2.5 text-sm font-bold text-white shadow-panel ui-transition hover:brightness-110 active:scale-[0.98]"
        >
          <Plus size={15} /> إضافة موظف
        </button>
      }
    >
      <div className="space-y-5">
        {banner && (
          <div
            role="status"
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-panel ui-transition ${
              banner.type === "success"
                ? "border-success/35 bg-success/10 text-appText"
                : "border-danger/35 bg-badgeRedBg/30 text-appText"
            }`}
          >
            {banner.type === "success" ? (
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success/20 text-sm font-black text-success">
                ✓
              </span>
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            )}
            <p className="min-w-0 flex-1 font-semibold leading-snug">{banner.text}</p>
            <button
              type="button"
              onClick={() => setBanner(null)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-appSubtext ui-transition hover:bg-appMuted hover:text-appText"
            >
              إغلاق
            </button>
          </div>
        )}

        {loadError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-badgeRedBg/25 px-4 py-3 text-sm text-appText shadow-inner">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="rounded-xl border border-appBorder bg-appSurface px-3 py-1.5 text-xs font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <PageStatCard
            icon={Users}
            label="إجمالي الموظفين"
            value={employees.length}
            colorClass="bg-badgeBlueBg text-badgeBlueText"
            loading={loading}
          />
          <PageStatCard
            icon={UserCheck}
            label="نشط"
            value={activeCount}
            colorClass="bg-success/15 text-success"
            loading={loading}
          />
          <PageStatCard
            icon={PauseCircle}
            label="في إجازة"
            value={leaveCount}
            colorClass="bg-badgePurpleBg text-badgePurpleText"
            loading={loading}
          />
          <PageStatCard
            icon={Building2}
            label="الأقسام"
            value={departments.length}
            colorClass="bg-badgeGrayBg text-badgeGrayText"
            loading={loading}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-appBorder bg-appMuted/40 px-4 py-3 shadow-inner backdrop-blur-sm sm:px-5 sm:py-4">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-appSubtext"
            />
            <input
              className="w-full rounded-2xl border border-appBorder bg-appMuted/90 py-2 ps-8 pe-3 text-xs font-medium text-appText shadow-inner placeholder:text-appSubtext/80 ui-transition hover:border-brand/20 focus:border-brand focus:bg-appSurface focus:outline-none focus:ring-2 focus:ring-brand/25"
              placeholder="ابحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <Building2
              size={12}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-appSubtext"
            />
            <select
              className="min-w-[150px] cursor-pointer appearance-none rounded-2xl border border-appBorder bg-appMuted/90 py-2 ps-8 pe-7 text-xs font-medium text-appText shadow-inner ui-transition hover:border-brand/20 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value={DEPT_FILTER_ALL}>كل الأقسام</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {translate(d.name)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={11}
              className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-appSubtext"
            />
          </div>

          <div className="relative">
            <select
              className="min-w-[150px] cursor-pointer appearance-none rounded-2xl border border-appBorder bg-appMuted/90 py-2 ps-3 pe-8 text-xs font-medium text-appText shadow-inner ui-transition hover:border-brand/20 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value={STATUS_FILTER_ALL}>كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="SUSPENDED">في إجازة</option>
              <option value="RESIGNED">منتهي الخدمة</option>
            </select>
            <ChevronDown
              size={11}
              className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-appSubtext"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-raise">
          {!loading && employees.length === 0 && !loadError && (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-appBorder bg-appMuted">
                <Users className="text-appSubtext" size={26} />
              </div>
              <p className="text-sm font-semibold text-appText">لا يوجد موظفون بعد</p>
              <p className="mt-1 max-w-sm text-xs text-appSubtext">
                أضف أول موظف عبر الزر أعلاه — يتم الحفظ عبر واجهة{" "}
                <span className="font-mono text-[10px] text-brand">POST /api/users</span>.
              </p>
            </div>
          )}

          {(loading || employees.length > 0) && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-20 table-head-surface backdrop-blur-md">
                  <tr>
                    <th className="w-10 py-4 ps-6 pe-4 sm:py-5" />
                    {["الموظف", "المسمى الوظيفي", "القسم", "تاريخ التعيين", "الحالة", "الإجراءات"].map(
                      (h) => (
                        <th
                          key={h}
                          className="py-4 ps-4 pe-4 text-start text-[10px] font-extrabold uppercase tracking-[0.16em] text-appSubtext sm:py-5"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-appBorder/80">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, rowIdx) => (
                      <tr key={`skeleton-${rowIdx}`} className="table-row-interactive">
                        {Array.from({ length: 7 }).map((_, colIdx) => (
                          <td key={`skeleton-${rowIdx}-${colIdx}`} className="px-4 py-3.5">
                            <div
                              className="h-3.5 animate-pulse rounded-lg bg-appMuted"
                              style={{
                                width:
                                  colIdx === 0
                                    ? "2rem"
                                    : colIdx === 6
                                      ? "4rem"
                                      : `${55 + colIdx * 12}%`,
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-appSubtext">
                        لا توجد نتائج مطابقة للتصفية الحالية.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((emp) => (
                      <EmployeeTableRow
                        key={emp.id}
                        emp={emp}
                        roleLabel={getDisplayRole(emp, roles)}
                        deptLabel={getDisplayDept(emp, departments)}
                        statusForBadge={statusToBadgeLabel(emp.status)}
                        onEdit={openEdit}
                        onDelete={setDeleteId}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <Modal
          title={editEmp ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
          subtitle="يُرسل الطلب إلى /api/users بنفس حقول EmployeeCreationRequest في الخادم."
          size="lg"
          bodyScroll
          busy={saveSubmitting}
          onClose={() => {
            if (!saveSubmitting) setShowForm(false);
          }}
          footer={
            <>
              <button
                type="button"
                disabled={saveSubmitting}
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-appBorder bg-appMuted px-4 py-2 text-sm font-medium text-appText ui-transition hover:bg-appBorder/30 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={saveSubmitting}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-panel ui-transition hover:bg-brandDeep disabled:opacity-60"
              >
                {saveSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editEmp ? "حفظ التعديلات" : "إضافة الموظف"}
              </button>
            </>
          }
        >
          <div className="space-y-5">
            {formError && (
              <div className="rounded-xl border border-danger/30 bg-badgeRedBg/25 px-3 py-2 text-xs font-medium text-appText">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  الاسم الكامل *
                </label>
                <input
                  className={inputCls(!!fieldErrors.name)}
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  المسمى الوظيفي
                </label>
                <select
                  className={inputCls(false)}
                  value={form.roleId}
                  onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}
                >
                  <option value="">اختر المسمى</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {translate(r.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  القسم
                </label>
                <select
                  className={inputCls(!!fieldErrors.assignment)}
                  value={form.departmentId}
                  onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
                >
                  <option value="">اختر القسم</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {translate(d.name)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  الفرع
                </label>
                <select
                  className={inputCls(!!fieldErrors.assignment)}
                  value={form.branchId}
                  onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}
                >
                  <option value="">اختر الفرع</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {translate(b.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  الرقم القومي
                </label>
                <input
                  className={inputCls(false)}
                  value={form.nationalId}
                  onChange={(e) => setForm((p) => ({ ...p, nationalId: e.target.value }))}
                  placeholder="اختياري"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  className={inputCls(!!(fieldErrors.email || fieldErrors.emailFormat))}
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  رقم الهاتف
                </label>
                <input
                  className={inputCls(false)}
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  تاريخ التعيين
                </label>
                <input
                  type="date"
                  className={inputCls(false)}
                  value={form.hireDate}
                  onChange={(e) => setForm((p) => ({ ...p, hireDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  الحالة
                </label>
                <select
                  className={inputCls(false)}
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option>نشط</option>
                  <option>في إجازة</option>
                  <option>منتهي الخدمة</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteId != null && (
        <Modal
          title="تأكيد الحذف"
          subtitle="سيتم حذف المستخدم وتعييناته وأدواره على الخادم."
          busy={deleteSubmitting}
          onClose={() => {
            if (!deleteSubmitting) setDeleteId(null);
          }}
          footer={
            <>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-appBorder bg-appMuted px-4 py-2 text-sm font-medium text-appSubtext ui-transition hover:bg-appBorder/30 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white shadow-panel ui-transition hover:opacity-90 disabled:opacity-60"
              >
                {deleteSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                حذف الموظف
              </button>
            </>
          }
        >
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-badgeRedBg/50 ring-1 ring-danger/20">
              <AlertCircle size={24} className="text-danger" />
            </div>
            <p className="text-center text-sm text-appText">
              هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

export default EmployeeManagementPage;
