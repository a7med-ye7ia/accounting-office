import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Mail, Phone, Calendar, Building2, Briefcase,
  Edit, Save, X, AlertCircle, CheckCircle, ListTodo, FileText,
} from 'lucide-react';
import MainLayout from '../../../shared/layout/MainLayout';
import { Avatar, StatusBadge, Modal } from '../../../shared/components/HrShared';
import {
  getEmployeeProfile,
  updateUser,
  deleteUser,
} from '../../../api/users';
import { fetchDepartments } from '../../../api/departments';
import { fetchBranches } from '../../../api/branches';
import { fetchRoles } from '../../../api/roles';

const UI_MAP = {
  owner: 'صاحب العمل',
  headBranch: 'مدير فرع',
  headDepartment: 'رئيس قسم',
  employee: 'موظف',
  'Human Resources': 'الموارد البشرية',
  Finance: 'المحاسبة',
  Operations: 'تكنولوجيا المعلومات',
  Sales: 'المبيعات',
};

function inputCls() {
  return 'w-full ps-3 pe-3 py-2 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-appSubtext/80 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ui-transition';
}

function selectCls() {
  return 'w-full ps-3 pe-3 py-2 bg-appMuted border border-appBorder rounded-xl text-sm text-appText appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all';
}

const STATUSES = ['نشط', 'في إجازة', 'منتهي الخدمة'];

function translate(key) {
  if (key == null || key === '') return '—';
  return UI_MAP[key] || key;
}

function translateStatus(statusEn) {
  if (statusEn === 'ACTIVE') return 'نشط';
  if (statusEn === 'SUSPENDED') return 'في إجازة';
  if (statusEn === 'RESIGNED') return 'منتهي الخدمة';
  return statusEn || 'نشط';
}

/** Labels expected by {@link StatusBadge} in `HrShared`. */
function statusToBadgeLabel(statusEn) {
  const s = typeof statusEn === 'string' ? statusEn : '';
  if (s === 'ACTIVE') return 'Active';
  if (s === 'SUSPENDED') return 'On-Leave';
  if (s === 'RESIGNED') return 'Terminated';
  return 'Inactive';
}

function formatDate(value) {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(value) {
  if (value == null || value === '') return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-GB');
}

function mapStatusToEnum(arabicStatus) {
  switch (arabicStatus) {
    case 'نشط': return 'ACTIVE';
    case 'في إجازة': return 'SUSPENDED';
    case 'منتهي الخدمة': return 'RESIGNED';
    default: return 'ACTIVE';
  }
}

function EmployeeProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadEmployee = useCallback(async () => {
    if (!id) {
      setError('معرّف الموظف غير صالح');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [profileData, deptData, branchData, roleData] = await Promise.all([
        getEmployeeProfile(id),
        fetchDepartments(),
        fetchBranches(),
        fetchRoles(),
      ]);
      setDepartments(deptData);
      setBranches(branchData);
      setRoles(roleData);
      setEmployee(profileData);
      setFormData({});
    } catch (err) {
      setError('خطأ في تحميل بيانات الموظف');
      console.error('Error loading employee profile:', err);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  const handleEdit = () => {
    if (!employee) return;
    setFormData({
      fullName: employee.fullName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      nationalId: employee.nationalId || '',
      hireDate: employee.hireDate ? String(employee.hireDate).split('T')[0] : '',
      status: translateStatus(employee.status),
      departmentId: employee.departmentId != null ? String(employee.departmentId) : '',
      branchId: employee.branchId != null ? String(employee.branchId) : '',
      roleId: employee.roleId != null ? String(employee.roleId) : '',
    });
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
    setError(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!employee) return;
    if (!formData.fullName?.trim()) {
      setError('الاسم مطلوب');
      return;
    }
    if (!formData.email?.trim()) {
      setError('البريد الإلكتروني مطلوب');
      return;
    }

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      nationalId: formData.nationalId ? formData.nationalId : null,
      hireDate: formData.hireDate || null,
      status: mapStatusToEnum(formData.status),
      departmentId: formData.departmentId ? Number(formData.departmentId) : null,
      branchId: formData.branchId ? Number(formData.branchId) : null,
      roleId: formData.roleId ? Number(formData.roleId) : null,
    };

    try {
      setSaving(true);
      await updateUser(employee.id, payload);
      setIsEditing(false);
      setFormData({});
      setSuccessMessage('تم تحديث البيانات بنجاح');
      setTimeout(() => setSuccessMessage(''), 3000);
      setError(null);
      await loadEmployee();
    } catch (err) {
      setError('خطأ في تحديث البيانات');
      console.error('Error saving employee:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!employee) return;
    try {
      setSaving(true);
      await deleteUser(employee.id);
      setShowDeleteModal(false);
      setSuccessMessage('تم حذف الموظف بنجاح');
      setTimeout(() => {
        navigate('/EmployeeManagement');
      }, 1500);
    } catch (err) {
      setError('خطأ في حذف الموظف');
      console.error('Error deleting employee:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="ملف الموظف" subtitle="الموارد البشرية">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand" />
        </div>
      </MainLayout>
    );
  }

  if (!employee) {
    return (
      <MainLayout title="ملف الموظف" subtitle="الموارد البشرية">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-red-700 font-semibold">{error || 'الموظف غير موجود'}</p>
        </div>
      </MainLayout>
    );
  }

  const initials = employee.fullName?.substring(0, 2).toUpperCase() || '??';
  const roleDisplay = translate(employee.roleName);
  const deptDisplay = translate(employee.departmentName);
  const tasks = Array.isArray(employee.tasks) ? employee.tasks : [];
  const contracts = Array.isArray(employee.contracts) ? employee.contracts : [];

  const actions = (
    <div className="flex items-center gap-2">
      {!isEditing && (
        <button
          type="button"
          onClick={handleEdit}
          className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brandDeep active:scale-[0.98] transition-all"
        >
          <Edit size={15} /> تعديل
        </button>
      )}
      {isEditing && (
        <>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-success text-white text-sm font-semibold rounded-xl shadow-panel hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ui-transition"
          >
            <Save size={15} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-appMuted text-appText text-sm font-semibold rounded-xl border border-appBorder shadow-panel hover:bg-appBorder/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ui-transition"
          >
            <X size={15} /> إلغاء
          </button>
        </>
      )}
    </div>
  );

  return (
    <MainLayout title="ملف الموظف" subtitle="الموارد البشرية" actions={actions}>
      <div className="space-y-6 max-w-4xl">

        {successMessage && (
          <div className="bg-success/10 border border-appBorder rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-success" />
            <p className="text-success font-semibold text-sm">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-700 font-semibold text-sm">{error}</p>
          </div>
        )}

        <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-end gap-6">
          <Avatar initials={initials} size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-appText">{employee.fullName}</h2>
              <StatusBadge status={statusToBadgeLabel(employee.status)} />
              <span className="text-sm text-appSubtext">({translateStatus(employee.status)})</span>
            </div>
            <p className="text-appSubtext text-sm mb-1">{roleDisplay}</p>
            <p className="text-appSubtext text-xs flex items-center gap-1">
              <Building2 size={12} /> {deptDisplay}
              {employee.branchName ? (
                <span className="text-appSubtext"> · {translate(employee.branchName)}</span>
              ) : null}
            </p>
          </div>
        </div>

        {!isEditing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-appSurface border border-appBorder rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-appSubtext mb-5">
                  معلومات الاتصال
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                      <Mail size={14} /> البريد الإلكتروني
                    </label>
                    <a href={`mailto:${employee.email}`} className="text-brand hover:underline text-sm font-medium">
                      {employee.email}
                    </a>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                      <MapPin size={14} /> الرقم القومي
                    </label>
                    <p className="text-appText text-sm font-medium">{employee.nationalId || '—'}</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                      <Phone size={14} /> رقم الهاتف
                    </label>
                    {employee.phone ? (
                      <a href={`tel:${employee.phone}`} className="text-brand hover:underline text-sm font-medium">
                        {employee.phone}
                      </a>
                    ) : (
                      <p className="text-appText text-sm">—</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-appSurface border border-appBorder rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-appSubtext mb-5">
                  معلومات العمل
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                      <Briefcase size={14} /> المسمى الوظيفي
                    </label>
                    <p className="text-appText text-sm font-medium">{roleDisplay}</p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                      <Building2 size={14} /> القسم والفرع
                    </label>
                    <p className="text-appText text-sm font-medium">
                      {deptDisplay}
                      {employee.branchName ? ` · ${translate(employee.branchName)}` : ''}
                    </p>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                      <Calendar size={14} /> تاريخ التعيين
                    </label>
                    <p className="text-appText text-sm font-medium" dir="ltr">
                      {formatDate(employee.hireDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-appSurface border border-appBorder rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-appSubtext flex items-center gap-2 mb-2">
                <ListTodo size={16} /> المهام المرتبطة
              </h3>
              {tasks.length === 0 ? (
                <p className="text-appSubtext text-sm">لا توجد مهام مسجّلة لهذا الموظف.</p>
              ) : (
                <ul className="divide-y divide-appBorder rounded-xl border border-appBorder overflow-hidden">
                  {tasks.map((task) => (
                    <li key={task.id} className="ps-4 pe-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-appText text-sm">{task.title}</p>
                        <p className="text-[11px] text-appSubtext">{task.status}</p>
                      </div>
                      <p className="text-xs text-appSubtext tabular-nums" dir="ltr">{formatDateTime(task.dueDate)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-appSurface border border-appBorder rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-appSubtext flex items-center gap-2 mb-2">
                <FileText size={16} /> العقود التي أنشأها
              </h3>
              {contracts.length === 0 ? (
                <p className="text-appSubtext text-sm">لا توجد عقود مسجّلة.</p>
              ) : (
                <ul className="divide-y divide-appBorder rounded-xl border border-appBorder overflow-hidden">
                  {contracts.map((c) => (
                    <li key={c.id} className="ps-4 pe-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-semibold text-appText text-sm">{c.type}</p>
                        <p className="text-[11px] text-appSubtext">{c.status}</p>
                      </div>
                      <p className="text-xs text-appSubtext tabular-nums" dir="ltr">{formatDateTime(c.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="bg-appSurface border border-appBorder rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-appSubtext mb-6">
              تعديل بيانات الموظف
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-appSubtext text-xs font-semibold mb-2">الاسم الكامل *</label>
                  <input type="text" className={inputCls()} value={formData.fullName || ''} onChange={e => handleInputChange('fullName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-appSubtext text-xs font-semibold mb-2">البريد الإلكتروني *</label>
                  <input type="email" className={inputCls()} value={formData.email || ''} onChange={e => handleInputChange('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-appSubtext text-xs font-semibold mb-2">رقم الهاتف</label>
                  <input type="tel" className={inputCls()} value={formData.phone || ''} onChange={e => handleInputChange('phone', e.target.value)} />
                </div>
                <div>
                  <label className="block text-appSubtext text-xs font-semibold mb-2">الرقم القومي</label>
                  <input type="text" className={inputCls()} value={formData.nationalId || ''} onChange={e => handleInputChange('nationalId', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-appSubtext text-xs font-semibold mb-2">المسمى الوظيفي</label>
                  <select className={selectCls()} value={formData.roleId} onChange={e => handleInputChange('roleId', e.target.value)}>
                    <option value="">اختر المسمى</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{translate(r.name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-appSubtext text-xs font-semibold mb-2">الحالة</label>
                  <select className={selectCls()} value={formData.status || ''} onChange={e => handleInputChange('status', e.target.value)}>
                    {STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-appSubtext text-xs font-semibold mb-2">القسم</label>
                  <select className={selectCls()} value={formData.departmentId} onChange={e => handleInputChange('departmentId', e.target.value)}>
                    <option value="">اختر القسم</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{translate(d.name)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-appSubtext text-xs font-semibold mb-2">الفرع</label>
                  <select className={selectCls()} value={formData.branchId} onChange={e => handleInputChange('branchId', e.target.value)}>
                    <option value="">اختر الفرع</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{translate(b.name)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-appSubtext text-xs font-semibold mb-2">تاريخ التعيين</label>
                <input type="date" className={inputCls()} value={formData.hireDate || ''} onChange={e => handleInputChange('hireDate', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-red-700 mb-4">
              منطقة الخطر
            </h3>
            <p className="text-red-600 text-sm mb-4">
              سيؤدي حذف هذا الموظف إلى إزالة جميع بيانات الموظف بشكل دائم.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all"
            >
              حذف الموظف
            </button>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <Modal
          title="تأكيد حذف الموظف"
          onClose={() => setShowDeleteModal(false)}
          footer={(
            <>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
                className="ps-4 pe-4 py-2 text-appText font-semibold rounded-lg hover:bg-appMuted disabled:opacity-50 disabled:cursor-not-allowed ui-transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="ps-4 pe-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'جاري الحذف...' : 'حذف'}
              </button>
            </>
          )}
        >
          <p className="text-appSubtext mb-4">
            هل أنت متأكد من رغبتك في حذف {employee.fullName}؟
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </p>
        </Modal>
      )}
    </MainLayout>
  );
}

export default EmployeeProfilePage;
