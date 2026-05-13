import React, { useCallback, useMemo, useState } from "react";
import { Building2, Plus, Users, Pencil, Trash2, AlertCircle, MapPin, Loader2 } from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import { Modal, TableSkeleton, PageStatCard } from "../../../shared/components/HrShared";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../../api/departments";
import { fetchUsers } from "../../../api/users";
import { fetchBranches } from "../../../api/branches";
import { getApiErrorMessage } from "../../../utils/apiError";

const EMPTY_FORM = { name: "", branchId: "" };

function fieldClass(invalid) {
  return [
    "w-full rounded-2xl border bg-appMuted/80 px-3 py-2.5 text-sm font-medium text-appText shadow-inner",
    "placeholder:text-appSubtext/70 ui-transition",
    "hover:border-brand/25 hover:bg-appSurface/90",
    "focus:border-brand focus:bg-appSurface focus:outline-none focus:ring-2 focus:ring-brand/25",
    invalid ? "border-danger/60 ring-1 ring-danger/20" : "border-appBorder",
  ].join(" ");
}

/** @param {Array<{ departmentId?: number }>} users */
function countEmployeesByDepartment(users) {
  const map = new Map();
  for (const u of users) {
    const id = u.departmentId;
    if (id == null) continue;
    map.set(id, (map.get(id) || 0) + 1);
  }
  return map;
}

function DepartmentsPage() {
  const [depts, setDepts] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [deptData, userData, branchData] = await Promise.all([
        fetchDepartments(),
        fetchUsers(),
        fetchBranches(),
      ]);
      setDepts(Array.isArray(deptData) ? deptData : []);
      setUsers(Array.isArray(userData) ? userData : []);
      setBranches(Array.isArray(branchData) ? branchData : []);
    } catch (e) {
      setLoadError(getApiErrorMessage(e, "تعذر تحميل الأقسام."));
      setDepts([]);
      setUsers([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  const counts = useMemo(() => countEmployeesByDepartment(users), [users]);

  const totalStaffInDepts = useMemo(() => {
    let n = 0;
    counts.forEach((v) => {
      n += v;
    });
    return n;
  }, [counts]);

  const deptsWithStaff = useMemo(
    () => depts.filter((d) => (counts.get(d.id) || 0) > 0).length,
    [depts, counts],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditItem(null);
    setFieldErrors({});
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (d) => {
    setForm({
      name: d.name || "",
      branchId: d.branch?.id != null ? String(d.branch.id) : "",
    });
    setEditItem(d);
    setFieldErrors({});
    setFormError(null);
    setShowModal(true);
  };

  const validate = () => {
    const err = {};
    if (!form.name.trim()) err.name = true;
    if (!form.branchId) err.branchId = true;
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = async () => {
    setFormError(null);
    if (!validate()) {
      setFormError("يرجى تعبئة الحقول المطلوبة.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), branchId: Number(form.branchId) };
      if (editItem) {
        await updateDepartment(editItem.id, payload);
        setBanner({ type: "success", text: "تم تحديث القسم بنجاح." });
      } else {
        await createDepartment(payload);
        setBanner({ type: "success", text: "تم إنشاء القسم بنجاح." });
      }
      setShowModal(false);
      await loadAll();
    } catch (e) {
      setFormError(getApiErrorMessage(e, "تعذر حفظ القسم."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteSubmitting(true);
    try {
      await deleteDepartment(deleteId);
      setBanner({ type: "success", text: "تم حذف القسم." });
      setDeleteId(null);
      await loadAll();
    } catch (e) {
      setBanner({
        type: "error",
        text: getApiErrorMessage(e, "تعذر حذف القسم. قد يكون مرتبطًا بموظفين أو بيانات أخرى."),
      });
      setDeleteId(null);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const actions = (
    <button
      type="button"
      onClick={openCreate}
      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-b from-brand to-brandDeep px-4 py-2.5 text-sm font-bold text-white shadow-panel ui-transition hover:brightness-110 active:scale-[0.98]"
    >
      <Plus size={15} /> قسم جديد
    </button>
  );

  return (
    <MainLayout title="الأقسام" subtitle="التنظيم الداخلي" actions={actions}>
      <div className="space-y-6">
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
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-success/20 text-success">
                ✓
              </span>
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">{banner.text}</p>
            </div>
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
              onClick={() => loadAll()}
              className="rounded-xl border border-appBorder bg-appSurface px-3 py-1.5 text-xs font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          <PageStatCard
            icon={Building2}
            label="إجمالي الأقسام"
            value={depts.length}
            colorClass="bg-badgeBlueBg text-badgeBlueText"
            loading={loading}
          />
          <PageStatCard
            icon={Users}
            label="الموظفون ضمن أقسام"
            value={totalStaffInDepts}
            colorClass="bg-badgePurpleBg text-badgePurpleText"
            loading={loading}
          />
          <PageStatCard
            icon={MapPin}
            label="أقسام بها موظفون"
            value={deptsWithStaff}
            colorClass="bg-success/15 text-success"
            loading={loading}
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-raise">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-appBorder px-6 py-5 sm:px-8">
            <div>
              <h2 className="font-semibold text-appText">جميع الأقسام</h2>
              <p className="mt-0.5 text-xs text-appSubtext">
                البيانات مرتبطة بالفرع وفق نموذج الـ API الحالي (لا يعرض تاريخ الإنشاء من الخادم).
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-badgeBlueBg px-2.5 py-0.5 text-xs font-semibold text-badgeBlueText">
              {depts.length} إجمالي
            </span>
          </div>

          {!loading && depts.length === 0 && !loadError && (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-appBorder bg-appMuted">
                <Building2 size={28} className="text-appSubtext" />
              </div>
              <h3 className="text-sm font-semibold text-appText">لا توجد أقسام حتى الآن</h3>
              <p className="mt-1 max-w-xs text-xs text-appSubtext">
                أنشئ قسمًا واربطه بفرع ليظهر في تعيينات الموظفين.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-panel ui-transition hover:bg-brandDeep"
              >
                <Plus size={14} /> إنشاء قسم
              </button>
            </div>
          )}

          {(loading || depts.length > 0) && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-20 table-head-surface backdrop-blur-md">
                  <tr>
                    {["القسم", "الفرع", "عدد الموظفين", "الإجراءات"].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-start text-[10px] font-extrabold uppercase tracking-[0.16em] text-appSubtext sm:py-5"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                {loading ? (
                  <TableSkeleton rows={5} cols={4} />
                ) : (
                  <tbody className="divide-y divide-appBorder/80">
                    {depts.map((d, idx) => (
                      <tr
                        key={d.id}
                        className={`table-row-interactive ${idx % 2 === 0 ? "bg-appSurface" : "bg-appMuted/25"}`}
                      >
                        <td className="px-6 py-4 text-start">
                          <div className="flex items-center justify-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-appBorder bg-badgeBlueBg">
                              <Building2 size={14} className="text-badgeBlueText" />
                            </div>
                            <span className="font-semibold text-appText" dir="auto">
                              {d.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-start text-appSubtext" dir="auto">
                          {d.branch?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-start">
                          <div className="flex items-center justify-start gap-1.5">
                            <Users size={13} className="shrink-0 text-appSubtext" />
                            <span className="font-medium text-appText">{counts.get(d.id) ?? 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-start">
                          <div className="flex items-center justify-start gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(d)}
                              className="rounded-xl p-2 text-appSubtext ui-transition hover:bg-badgeBlueBg/50 hover:text-brand"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(d.id)}
                              className="rounded-xl p-2 text-appSubtext ui-transition hover:bg-badgeRedBg/50 hover:text-danger"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <Modal
          title={editItem ? "تعديل القسم" : "إنشاء قسم"}
          subtitle="الاسم والفرع مطلوبان لمطابقة نموذج الـ API (Department + Branch)."
          onClose={() => {
            if (!submitting) setShowModal(false);
          }}
          size="lg"
          bodyScroll
          busy={submitting}
          footer={
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-appBorder bg-appMuted px-4 py-2 text-sm font-medium text-appText ui-transition hover:bg-appBorder/40 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-panel ui-transition hover:bg-brandDeep disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editItem ? "حفظ التغييرات" : "إنشاء القسم"}
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
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                اسم القسم *
              </label>
              <input
                className={fieldClass(!!fieldErrors.name)}
                placeholder="مثال: المحاسبة"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                الفرع *
              </label>
              <select
                className={fieldClass(!!fieldErrors.branchId)}
                value={form.branchId}
                onChange={(e) => setForm((p) => ({ ...p, branchId: e.target.value }))}
              >
                <option value="">اختر الفرع</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {branches.length === 0 && (
                <p className="mt-1.5 text-xs text-appSubtext">لا توجد فروع من الخادم — أنشئ فرعًا أولًا.</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {deleteId != null && (
        <Modal
          title="حذف القسم"
          subtitle="قد يفشل الحذف إذا كان القسم مستخدمًا في تعيينات."
          onClose={() => {
            if (!deleteSubmitting) setDeleteId(null);
          }}
          busy={deleteSubmitting}
          footer={
            <>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setDeleteId(null)}
                className="rounded-xl border border-appBorder bg-appMuted px-4 py-2 text-sm font-medium text-appText ui-transition hover:bg-appBorder/40 disabled:opacity-50"
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
                حذف
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-appBorder bg-badgeRedBg">
              <AlertCircle size={18} className="text-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-appText">هل تريد حذف هذا القسم؟</p>
              <p className="mt-1 text-xs leading-relaxed text-appSubtext">
                لا يمكن التراجع عن الإجراء بعد نجاح الحذف على الخادم.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

export default DepartmentsPage;
