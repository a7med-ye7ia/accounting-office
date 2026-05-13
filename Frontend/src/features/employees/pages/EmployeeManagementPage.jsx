import React, { useState, useEffect } from "react";
import {
  Users, Plus, Search, ChevronDown, Building2, AlertCircle,
} from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import { Modal } from "../../../shared/components/HrShared";
import EmployeeTableRow from "../ui/EmployeeTableRow";

// استيراد الـ APIs
import { fetchDepartments } from "../../../api/departments";
import { fetchBranches } from "../../../api/branches";
import { fetchRoles } from "../../../api/roles";
import { fetchUsers, addUser, updateUser, deleteUser } from "../../../api/users";

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
  name: "", nationalId: "", roleId: "", departmentId: "", email: "", branchId: "", phone: "", hireDate: "", status: "نشط",
};

function inputCls() {
  return "w-full ps-3 pe-3 py-2 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all";
}

function EmployeeManagementPage() {
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("الكل");
  const [statusFilter, setStatus] = useState("الكل");
  const [selected, setSelected] = useState(new Set());
  const [slideEmp, setSlideEmp] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(EMPTY_EMP);
  const [deleteId, setDeleteId] = useState(null);

  // --- دوال الترجمة والتجهيز (Helpers) ---
  const translate = (key) => UI_MAP[key] || key;

  const translateStatus = (statusEn) => {
    if (statusEn === "ACTIVE") return "نشط";
    if (statusEn === "SUSPENDED") return "في إجازة";
    if (statusEn === "RESIGNED") return "منتهي الخدمة";
    return statusEn || "نشط";
  };

  /** Maps API enum to labels expected by {@link StatusBadge} in `HrShared`. */
  const statusToBadgeLabel = (statusEn) => {
    const s = typeof statusEn === "string" ? statusEn : "";
    if (s === "ACTIVE") return "نشط";
    if (s === "SUSPENDED") return "في إجازة";
    if (s === "RESIGNED") return "منتهي الخدمة";
    return "نشط";
  };

  const getDisplayRole = (emp) => {
    try {
      if (emp.roleName) return translate(emp.roleName);
      if (emp.role && emp.role.name) return translate(emp.role.name);

      const targetId = emp.roleId || (emp.role && emp.role.id);
      if (targetId) {
        const roleObj = roles.find(r => r.id == targetId);
        if (roleObj) return translate(roleObj.name);
      }

      // Debug: role not resolved
      console.debug('[EmployeeManagement] could not resolve role for employee:', emp?.id || emp, 'roleId:', emp?.roleId, 'role:', emp?.role, 'roleName:', emp?.roleName);
      console.debug('[EmployeeManagement] available roles:', roles);
      return translate(emp.role) || "—";
    } catch (err) {
      console.error('[EmployeeManagement] error in getDisplayRole for emp:', emp, err);
      return "—";
    }
  };

  const getDisplayDept = (emp) => {
    if (emp.departmentName) return translate(emp.departmentName);
    if (emp.department && emp.department.name) return translate(emp.department.name);

    const targetId = emp.departmentId || (emp.department && emp.department.id);
    if (targetId) {
      const deptObj = departments.find(d => d.id == targetId);
      if (deptObj) return translate(deptObj.name);
    }

    // 4. لو كل ده فشل
    return translate(emp.dept) || "—";
  };  
  // ----------------------------------------

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptData, empData, branchData, roleData] = await Promise.all([
        fetchDepartments(),
        fetchUsers(),
        fetchBranches(),
        fetchRoles(),
      ]);
      console.debug('[EmployeeManagement] fetched data', { deptDataCount: deptData?.length, empDataCount: empData?.length, branchDataCount: branchData?.length, roleDataCount: roleData?.length });
      console.debug('[EmployeeManagement] sample employee', empData && empData[0]);
      setDepartments(deptData);
      setEmployees(empData);
      setBranches(branchData);
      setRoles(roleData);
    } catch (error) {
      console.error('[EmployeeManagement] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = employees.filter((e) => {
    const matchName = e.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "الكل" || e.departmentId === Number(deptFilter);
    const matchStatus = statusFilter === "الكل" || e.status === statusFilter;
    return matchName && matchDept && matchStatus;
  });

  const openCreate = () => { setForm(EMPTY_EMP); setEditEmp(null); setShowForm(true); };

  const openEdit = (emp) => {
    setForm({
      name: emp.fullName,
      nationalId: emp.nationalId || "",
      email: emp.email,
      phone: emp.phone,
      hireDate: emp.hireDate,
      status: emp.status === "ACTIVE" ? "نشط" : emp.status === "SUSPENDED" ? "في إجازة" : "منتهي الخدمة",
      departmentId: emp.departmentId || "",
      branchId: emp.branchId || "",
      roleId: emp.roleId || "", 
    });
    setEditEmp(emp);
    setShowForm(true);
  };

  const mapStatusToEnum = (arabicStatus) => {
    switch (arabicStatus) {
      case "نشط": return "ACTIVE";
      case "في إجازة": return "SUSPENDED";
      case "منتهي الخدمة": return "RESIGNED";
      default: return "ACTIVE";
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const userData = {
      fullName: form.name,
      email: form.email,
      phone: form.phone,
      nationalId: form.nationalId ? form.nationalId : null,
      hireDate: form.hireDate,
      status: mapStatusToEnum(form.status),
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      branchId: form.branchId ? Number(form.branchId) : null,
      roleId: form.roleId ? Number(form.roleId) : null,
    };

    // Do not send password on create; backend will apply default if needed


    try {
      if (editEmp) {
        await updateUser(editEmp.id, userData);
      } else {
        await addUser(userData);
      }
      setShowForm(false);
      setEditEmp(null);
      await loadData();
    } catch (error) {
      console.error("حدث خطأ أثناء حفظ البيانات:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteUser(deleteId);
      setDeleteId(null);
      await loadData();
    } catch (error) {
      console.error("حدث خطأ أثناء حذف الموظف:", error);
    }
  };

  const activeCount = employees.filter((e) => e.status === "ACTIVE" || e.status === "نشط").length;
  const leaveCount = employees.filter((e) => e.status === "SUSPENDED" || e.status === "في إجازة").length;

  return (
    <MainLayout title="دليل الموظفين" subtitle="الموارد البشرية" actions={<button onClick={openCreate} className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brandDeep active:scale-[0.98] transition-all"><Plus size={15} /> إضافة موظف</button>}>
      <div className="space-y-5">
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[{ label: "إجمالي الموظفين", value: employees.length, colorClass: "bg-blue-50 text-brand" },
            { label: "نشط", value: activeCount, colorClass: "bg-emerald-50 text-emerald-600" },
            { label: "في إجازة", value: leaveCount, colorClass: "bg-amber-50 text-amber-600" },
            { label: "الأقسام", value: departments.length, colorClass: "bg-purple-50 text-purple-600" }
          ].map((s) => (
            <div key={s.label} className="bg-appSurface rounded-2xl border border-appBorder p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.colorClass}`}><Users size={16} /></div>
              <div>
                <p className="text-xl font-extrabold font-display text-appText">{loading ? "—" : s.value}</p>
                <p className="text-[11px] text-appSubtext">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-appSurface rounded-2xl border border-appBorder ps-4 pe-4 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="w-full ps-8 pe-3 py-2 bg-appMuted border border-appBorder rounded-xl text-xs text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all" placeholder="ابحث عن موظف..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="relative">
            <Building2 size={12} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select className="ps-8 pe-7 py-2 bg-appMuted border border-appBorder rounded-xl text-xs text-appText appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all min-w-[150px]" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="الكل">كل الأقسام</option>
              {departments.map((d) => (<option key={d.id} value={d.id}>{translate(d.name)}</option>))}
            </select>
            <ChevronDown size={11} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-appSurface rounded-2xl border border-appBorder overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-appBorder">
                  <th className="ps-6 pe-4 py-3 w-10"></th>
                  {["الموظف", "المسمي الوظيفي", "القسم", "تاريخ التعيين", "الحالة", "الإجراءات"].map((h) => (
                    <th key={h} className="ps-4 pe-4 py-3 text-start text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, rowIdx) => (
                    <tr key={`skeleton-${rowIdx}`} className="border-b border-slate-100">
                      {Array.from({ length: 7 }).map((_, colIdx) => (
                        <td key={`skeleton-${rowIdx}-${colIdx}`} className="px-4 py-3.5">
                          <div
                            className="h-3.5 rounded bg-slate-200 animate-pulse"
                            style={{ width: colIdx === 0 ? "2rem" : colIdx === 6 ? "4rem" : `${55 + colIdx * 12}%` }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  filtered.map((emp) => (
                    <EmployeeTableRow
                      key={emp.id}
                      emp={emp}
                      roleLabel={getDisplayRole(emp)}
                      deptLabel={getDisplayDept(emp)}
                      statusForBadge={statusToBadgeLabel(emp.status)}
                      onEdit={openEdit}
                      onDelete={setDeleteId}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <Modal title={editEmp ? "تعديل بيانات الموظف" : "إضافة موظف جديد"} onClose={() => setShowForm(false)} footer={<><button onClick={() => setShowForm(false)} className="ps-4 pe-4 py-2 text-sm font-medium text-appSubtext bg-white border border-appBorder rounded-xl hover:bg-appMuted transition-colors">إلغاء</button><button onClick={handleSave} className="ps-4 pe-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep transition-colors">{editEmp ? "حفظ التعديلات" : "إضافة الموظف"}</button></>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الاسم الكامل *</label><input className={inputCls()} value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">المسمى الوظيفي</label>
                <select className={inputCls()} value={form.roleId} onChange={(e) => setForm((p) => ({ ...p, roleId: e.target.value }))}>
                  <option value="">اختر المسمى</option>
                  {roles.map((r) => (<option key={r.id} value={r.id}>{translate(r.name)}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">القسم</label>
                <select className={inputCls()} value={form.departmentId} onChange={e => setForm(p => ({ ...p, departmentId: e.target.value }))}>
                  <option value="">اختر القسم</option>
                  {departments.map(d => (<option key={d.id} value={d.id}>{translate(d.name)}</option>))}
                </select>
              </div>
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الفرع</label>
                <select className={inputCls()} value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
                  <option value="">اختر الفرع</option>
                  {branches.map(b => (<option key={b.id} value={b.id}>{translate(b.name)}</option>))}
                </select>
              </div>
            </div>
            {/* باقي الحقول: ايميل، تليفون، تاريخ، حالة */}
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الرقم القومي</label><input className={inputCls()} value={form.nationalId} onChange={(e) => setForm((p) => ({ ...p, nationalId: e.target.value }))} placeholder="الرقم القومي" /></div>
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">البريد الإلكتروني</label><input type="email" className={inputCls()} value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">رقم الهاتف</label><input className={inputCls()} value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">تاريخ التعيين</label><input type="date" className={inputCls()} value={form.hireDate} onChange={(e) => setForm((p) => ({ ...p, hireDate: e.target.value }))} /></div>
              <div><label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الحالة</label>
                <select className={inputCls()} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  <option>نشط</option><option>في إجازة</option><option>منتهي الخدمة</option>
                </select>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal
          title="تأكيد الحذف"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button
                onClick={() => setDeleteId(null)}
                className="ps-4 pe-4 py-2 text-sm font-medium text-appSubtext bg-white border border-appBorder rounded-xl hover:bg-appMuted transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="ps-4 pe-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                حذف الموظف
              </button>
            </>
          }
        >
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-500" />
            </div>
            <p className="text-sm text-appText text-center">
              هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

export default EmployeeManagementPage;