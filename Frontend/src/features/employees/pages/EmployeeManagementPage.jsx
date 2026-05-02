import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, Plus, Search, ChevronDown, Filter,
  Mail, Phone, Calendar, Building2,
  CheckSquare, Square, Pencil, Trash2,
  AlertCircle, UserCheck,
} from 'lucide-react';
import MainLayout from '../../../shared/layout/MainLayout';
import {
  Avatar, StatusBadge, Modal, SlideOver, TableSkeleton,
} from '../../../shared/components/HrShared';
import { getDepartmentNames } from '../../../api/departments';
import { fetchUsers } from '../../../api/users';

const EMPTY_EMP = {
  name: '', role: '', dept: '', email: '',
  phone: '', hireDate: '', status: 'نشط',
};

// const EMPTY_EMP = {
//   name: '', role: '', dept: HR_DEPT_NAMES[0] || '', email: '',
//   phone: '', hireDate: '', status: 'نشط',
// };

function inputCls() {
  return 'w-full ps-3 pe-3 py-2 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all';
}

function EmployeeManagementPage() {
  const { t } = useTranslation();
  const [employees, setEmployees]   = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [deptFilter, setDeptFilter] = useState('الكل');
  const [statusFilter, setStatus]   = useState('الكل');
  const [selected, setSelected]     = useState(new Set());
  const [slideEmp, setSlideEmp]     = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [editEmp, setEditEmp]       = useState(null);
  const [form, setForm]             = useState(EMPTY_EMP);
  const [deleteId, setDeleteId]     = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptData, empData] = await Promise.all([getDepartmentNames(), fetchUsers()]);
        setDepartments(deptData);
        setEmployees(empData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // const t = setTimeout(() => { setEmployees(HR_EMPLOYEES); setLoading(false); }, 1400);
    // return () => clearTimeout(t);
  }, []);

  const filtered = employees.filter(e => {
    const matchName   = e.fullName.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptFilter === 'الكل' || e.dept === deptFilter;
    const matchStatus = statusFilter === 'الكل' || e.status === statusFilter;
    return matchName && matchDept && matchStatus;
  });

  const toggleSelect = id => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () =>
    selected.size === filtered.length
      ? setSelected(new Set())
      : setSelected(new Set(filtered.map(e => e.id)));

  const openCreate = () => { setForm(EMPTY_EMP); setEditEmp(null); setShowForm(true); };
  const openEdit   = emp => {
    setForm({ name: emp.fullName, role: emp.role, dept: emp.dept, email: emp.email,
              phone: emp.phone, hireDate: emp.hireDate, status: emp.status });
    setEditEmp(emp);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const initials = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (editEmp) {
      setEmployees(prev => prev.map(e => e.id === editEmp.id ? { ...e, ...form, avatar: initials } : e));
    } else {
      setEmployees(prev => [...prev, { id: Date.now(), ...form, avatar: initials }]);
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    setEmployees(prev => prev.filter(e => e.id !== deleteId));
    if (slideEmp?.id === deleteId) setSlideEmp(null);
    setDeleteId(null);
  };

  const handleBulkDelete = () => {
    setEmployees(prev => prev.filter(e => !selected.has(e.id)));
    setSelected(new Set());
  };

  const activeCount = employees.filter(e => e.status === 'نشط').length;
  const leaveCount  = employees.filter(e => e.status === 'في إجازة').length;

  const actions = (
    <button
      onClick={openCreate}
      className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brandDeep active:scale-[0.98] transition-all"
    >
      <Plus size={15} /> إضافة موظف
    </button>
  );

  return (
    <MainLayout title="دليل الموظفين" subtitle="الموارد البشرية" actions={actions}>
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'إجمالي الموظفين', value: employees.length,     colorClass: 'bg-blue-50 text-brand' },
            { label: 'نشط',             value: activeCount,           colorClass: 'bg-emerald-50 text-emerald-600' },
            { label: 'في إجازة',        value: leaveCount,            colorClass: 'bg-amber-50 text-amber-600' },
            { label: 'الأقسام',         value: departments.length,    colorClass: 'bg-purple-50 text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-appSurface rounded-2xl border border-appBorder p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.colorClass}`}>
                <Users size={16} />
              </div>
              <div>
                <p className="text-xl font-extrabold font-display text-appText">{loading ? '—' : s.value}</p>
                <p className="text-[11px] text-appSubtext">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="bg-appSurface rounded-2xl border border-appBorder ps-4 pe-4 py-3 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full ps-8 pe-3 py-2 bg-appMuted border border-appBorder rounded-xl text-xs text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
              placeholder="ابحث عن موظف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Department filter */}
          <div className="relative">
            <Building2 size={12} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="ps-8 pe-7 py-2 bg-appMuted border border-appBorder rounded-xl text-xs text-appText appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all min-w-[150px]"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="الكل">كل الأقسام</option>
              {departments.map(d => <option key={d}>{d}</option>)}
            </select>
            <ChevronDown size={11} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter size={12} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="ps-8 pe-7 py-2 bg-appMuted border border-appBorder rounded-xl text-xs text-appText appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all min-w-[130px]"
              value={statusFilter}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="الكل">كل الحالات</option>
              <option>نشط</option>
              <option>في إجازة</option>
              <option>منتهي الخدمة</option>
            </select>
            <ChevronDown size={11} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Bulk delete */}
          {selected.size > 0 && (
            <div className="flex items-center gap-2 ms-auto">
              <span className="text-xs text-appSubtext font-medium">{selected.size} محدد</span>
              <button onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 ps-3 pe-3 py-1.5 bg-danger text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors">
                <Trash2 size={12} /> حذف المحددين
              </button>
            </div>
          )}

          <span className="text-xs text-appSubtext ms-auto">{filtered.length} نتيجة</span>
        </div>

        {/* Table */}
        <div className="bg-appSurface rounded-2xl border border-appBorder overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-appBorder">
                  <th className="ps-6 pe-4 py-3 w-10">
                    <button onClick={toggleAll} className="text-appSubtext hover:text-brand transition-colors">
                      {selected.size === filtered.length && filtered.length > 0
                        ? <CheckSquare size={15} className="text-brand" />
                        : <Square size={15} />}
                    </button>
                  </th>
                  {['الموظف', 'المسمى الوظيفي', 'القسم', 'تاريخ التعيين', 'الحالة', 'الإجراءات'].map(h => (
                    <th key={h} className="ps-4 pe-4 py-3 text-start text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {loading
                ? <TableSkeleton rows={6} cols={7} />
                : (
                  <tbody>
                    {filtered.map(emp => (
                      <tr key={emp.id}
                        className={`border-b border-slate-100 hover:bg-appMuted transition-colors ${selected.has(emp.id) ? 'bg-blue-50/40' : ''}`}>
                        <td className="ps-6 pe-4 py-4">
                          <button onClick={() => toggleSelect(emp.id)} className="text-appSubtext hover:text-brand transition-colors">
                            {selected.has(emp.id)
                              ? <CheckSquare size={15} className="text-brand" />
                              : <Square size={15} />}
                          </button>
                        </td>
                        <td className="ps-4 pe-4 py-4">
                          <button className="flex items-center gap-3 text-start group" onClick={() => setSlideEmp(emp)}>
                            <Avatar initials={emp.avatar} />
                            <div>
                              <p className="font-semibold text-appText group-hover:text-brand transition-colors text-sm">
                                {emp.name}
                              </p>
                              <p className="text-[11px] text-appSubtext">{emp.email}</p>
                            </div>
                          </button>
                        </td>
                        <td className="ps-4 pe-4 py-4 text-appSubtext text-sm">{emp.role}</td>
                        <td className="ps-4 pe-4 py-4">
                          <span className="inline-flex items-center ps-2.5 pe-2.5 py-0.5 rounded-full text-xs font-semibold bg-badgeBlueBg text-badgeBlueText">
                            {emp.dept}
                          </span>
                        </td>
                        <td className="ps-4 pe-4 py-4 text-appSubtext text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-400" />
                            <span dir="ltr">
                              {new Date(emp.hireDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td className="ps-4 pe-4 py-4"><StatusBadge status={emp.status} /></td>
                        <td className="ps-4 pe-4 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(emp)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-blue-50 transition-colors">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setDeleteId(emp.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-red-50 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <Users size={28} className="text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-appSubtext">لا يوجد موظفون مطابقون للبحث</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                )
              }
            </table>
          </div>
        </div>
      </div>

      {/* Employee Slide-Over */}
      {slideEmp && (
        <SlideOver title={slideEmp.name} subtitle={slideEmp.role} onClose={() => setSlideEmp(null)}>
          <div className="ps-6 pe-6 py-6 bg-gradient-to-br from-brand to-brandDeep text-white flex items-center gap-4">
            <Avatar initials={slideEmp.avatar} size="lg" />
            <div>
              <p className="font-bold text-lg leading-tight">{slideEmp.name}</p>
              <p className="text-blue-200 text-sm">{slideEmp.role}</p>
              <div className="mt-2"><StatusBadge status={slideEmp.status} /></div>
            </div>
          </div>

          <div className="ps-6 pe-6 py-5 space-y-6">
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-appSubtext mb-3">معلومات الاتصال</h3>
              <div className="space-y-2">
                <a href={`mailto:${slideEmp.email}`}
                  className="flex items-center gap-3 text-sm text-appText hover:text-brand transition-colors group">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Mail size={14} className="text-brand" />
                  </div>
                  <span dir="ltr">{slideEmp.email}</span>
                </a>
                <div className="flex items-center gap-3 text-sm text-appText">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Phone size={14} className="text-emerald-600" />
                  </div>
                  <span dir="ltr">{slideEmp.phone}</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-appSubtext mb-3">التفاصيل</h3>
              <div className="space-y-3">
                {[
                  { icon: Building2, color: 'bg-purple-50 text-purple-600', label: 'القسم',           value: slideEmp.dept },
                  { icon: Calendar,  color: 'bg-amber-50 text-amber-600',   label: 'تاريخ الانضمام',
                    value: new Date(slideEmp.hireDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  { icon: UserCheck, color: 'bg-blue-50 text-brand',        label: 'الحالة الوظيفية', value: slideEmp.status },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                      <item.icon size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-appSubtext uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-medium text-appText">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setSlideEmp(null); openEdit(slideEmp); }}
                className="flex-1 inline-flex items-center justify-center gap-2 ps-4 pe-4 py-2.5 bg-appMuted border border-appBorder text-appText text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Pencil size={13} /> تعديل الملف الشخصي
              </button>
              <button
                onClick={() => setDeleteId(slideEmp.id)}
                className="inline-flex items-center justify-center gap-2 ps-3 pe-3 py-2.5 bg-red-50 border border-red-200 text-danger text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </SlideOver>
      )}

      {/* Add / Edit Modal */}
      {showForm && (
        <Modal
          title={editEmp ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button onClick={() => setShowForm(false)}
                className="ps-4 pe-4 py-2 text-sm font-medium text-appSubtext bg-white border border-appBorder rounded-xl hover:bg-appMuted transition-colors">
                إلغاء
              </button>
              <button onClick={handleSave}
                className="ps-4 pe-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep transition-colors">
                {editEmp ? 'حفظ التعديلات' : 'إضافة الموظف'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الاسم الكامل *</label>
                <input className={inputCls()} placeholder="أدخل الاسم الكامل" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">المسمى الوظيفي</label>
                <input className={inputCls()} placeholder="أدخل المسمى الوظيفي" value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">القسم</label>
                <select className={inputCls()} value={form.dept}
                  onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الحالة</label>
                <select className={inputCls()} value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                  <option>نشط</option>
                  <option>في إجازة</option>
                  <option>منتهي الخدمة</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">البريد الإلكتروني</label>
                <input type="email" className={inputCls()} placeholder="example@company.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">رقم الهاتف</label>
                <input className={inputCls()} placeholder="+20 xxx xxx xxxx" value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">تاريخ التعيين</label>
              <input type="date" className={inputCls()} value={form.hireDate}
                onChange={e => setForm(p => ({ ...p, hireDate: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <Modal
          title="حذف الموظف"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button onClick={() => setDeleteId(null)}
                className="ps-4 pe-4 py-2 text-sm font-medium text-appSubtext bg-white border border-appBorder rounded-xl hover:bg-appMuted transition-colors">
                إلغاء
              </button>
              <button onClick={handleDelete}
                className="ps-4 pe-4 py-2 text-sm font-semibold text-white bg-danger rounded-xl hover:bg-red-700 transition-colors">
                حذف
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle size={18} className="text-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-appText">هل أنت متأكد من حذف هذا الموظف؟</p>
              <p className="text-xs text-appSubtext mt-1">لا يمكن التراجع عن هذا الإجراء بعد تأكيده.</p>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

export default EmployeeManagementPage;