import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin, Mail, Phone, Calendar, Building2, Briefcase,
  Edit, Save, X, AlertCircle, CheckCircle, ListTodo, FileText,
} from 'lucide-react';
import MainLayout from '../../../shared/layout/MainLayout';
import { Avatar, StatusBadge, Modal } from '../../../shared/components/HrShared';
import TaskDetailsModel from '../../tasks/pages/TaskDetailsModel';
import {
  getEmployeeProfile,
  updateUser,
  deleteUser,
} from '../../../api/users';
import { getMyToday, getMyHistory, startAttendance, endAttendance } from '../../../api/attendance';
import AttendanceLocationLink from '../../attendance/AttendanceLocationLink';
import { fetchDepartments } from '../../../api/departments';
import { fetchBranches } from '../../../api/branches';
import { fetchRoles } from '../../../api/roles';
import { deleteTask, updateTask } from '../../../api/tasks';

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

function formatAttendanceDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatAttendanceTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function formatWorkedMinutes(minutes) {
  if (minutes == null) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} دقيقة`;
  if (!rest) return `${hours} ساعات`;
  return `${hours} ساعات و ${rest} دقيقة`;
}

function attendanceStatusLabel(status) {
  return { NOT_STARTED: 'لم يبدأ', WORKING: 'يعمل الآن', COMPLETED: 'تم الانتهاء' }[status] || 'غير متاح';
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [assignedByTasks, setAssignedByTasks] = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const currentUserRole = String(currentUser?.roleName || '').toLowerCase();
  const canRecordAttendance = currentUser
    && Number(currentUser.id) === Number(id)
    && ['employee', 'headdepartment'].includes(currentUserRole);

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
      setAssignedByTasks(Array.isArray(profileData.assignedByTasks) ? profileData.assignedByTasks : []);
      setFormData({});
      try {
        if (canRecordAttendance) {
          setAttendanceLoading(true);
          const today = await getMyToday();
          setAttendanceStatus(today.status);
        }
      } catch (e) {
        console.error('Failed to load attendance', e);
      } finally {
        setAttendanceLoading(false);
      }
    } catch (err) {
      setError('خطأ في تحميل بيانات الموظف');
      console.error('Error loading employee profile:', err);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [id, canRecordAttendance]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  const location = useLocation();
  useEffect(() => {
    const taskId = location.state?.openTaskId;

    if(!taskId || assignedByTasks.length === 0) return;

    const task = assignedByTasks.find(
      t => t.id === taskId
    );

    if(task){
      setSelectedTask(task);
    }

  }, [assignedByTasks, location.state]);

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

  const handleDeleteTask = async (taskId) => {
    if (!taskId) return;
    try {
      await deleteTask(taskId);
      setAssignedByTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleAcceptTask = async (taskId) => {
    if (!taskId) return;
    try {
      await updateTask(taskId, { status: 'ACCEPTED' });
      setAssignedByTasks(prev => prev.filter(t => t.id !== taskId));
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error('Error accepting task:', err);
    }
  };

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('المتصفح لا يدعم تحديد الموقع'));
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      setGettingLocation(false);
      resolve(pos.coords);
    }, (err) => {
      setGettingLocation(false);
      reject(err);
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });

  const handleStartWork = async () => {
    setError(null);
    try {
      const coords = await getLocation();
      const payload = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
      setAttendanceLoading(true);
      await startAttendance(payload);
      setAttendanceStatus('WORKING');
      setSuccessMessage('تم تسجيل بداية الدوام');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      if (err && err.code === 1) {
        setError('يرجى السماح بالوصول إلى الموقع لتسجيل الحضور.');
      } else {
        setError(err?.response?.status === 403 ? 'ليس لديك صلاحية لتسجيل الحضور.' : 'تعذر تسجيل الحضور.');
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleEndWork = async () => {
    setError(null);
    try {
      const coords = await getLocation();
      const payload = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
      setAttendanceLoading(true);
      await endAttendance(payload);
      setAttendanceStatus('COMPLETED');
      setSuccessMessage('تم تسجيل نهاية الدوام');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      if (err && err.code === 1) {
        setError('يرجى السماح بالوصول إلى الموقع لتسجيل الحضور.');
      } else {
        setError(err?.response?.status === 403 ? 'ليس لديك صلاحية لتسجيل الحضور.' : 'تعذر إنهاء الحضور.');
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  const openAttendanceHistory = async () => {
    try {
      setAttendanceHistory(await getMyHistory());
      setShowAttendanceHistory(true);
    } catch {
      setError('تعذر تحميل سجل الحضور.');
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

        {canRecordAttendance && (
          <div className="bg-appSurface border border-brand/20 rounded-2xl p-6 shadow-panel" dir="rtl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-appText">الحضور والانصراف</h3>
                <p className="text-sm text-appSubtext mt-1">
                  الحالة: {attendanceStatus === 'WORKING' ? 'يعمل الآن' : attendanceStatus === 'COMPLETED' ? 'تم إنهاء العمل اليوم' : 'لم يبدأ'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {attendanceStatus === 'WORKING' ? (
                  <button type="button" onClick={handleEndWork} disabled={attendanceLoading || gettingLocation} className="px-5 py-3 bg-danger text-white rounded-xl font-semibold">
                    {gettingLocation ? 'جارٍ تحديد الموقع...' : 'إنهاء العمل'}
                  </button>
                ) : attendanceStatus === 'COMPLETED' ? (
                  <span className="px-5 py-3 rounded-xl bg-success/10 text-success font-semibold">تم إنهاء العمل اليوم</span>
                ) : (
                  <button type="button" onClick={handleStartWork} disabled={attendanceLoading || gettingLocation} className="px-5 py-3 bg-brand text-white rounded-xl font-semibold">
                    {gettingLocation ? 'جارٍ تحديد الموقع...' : 'بدء العمل'}
                  </button>
                )}
                <button type="button" onClick={openAttendanceHistory} className="px-5 py-3 border border-appBorder rounded-xl text-appText font-semibold hover:bg-appMuted">
                  سجل الحضور
                </button>
              </div>
            </div>
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
                <ListTodo size={16} /> المهام التي قمت بتعينها
              </h3>
              {assignedByTasks.length === 0 ? (
                <p className="text-appSubtext text-sm">لا توجد مهام مسجّلة لهذا الموظف.</p>
              ) : (
                <ul className="divide-y divide-appBorder rounded-xl border border-appBorder overflow-hidden">
                  {assignedByTasks.map((task) => (
                    <li
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="ps-4 pe-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 cursor-pointer hover:bg-appMuted/50 ui-transition"
                    >
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

      {showAttendanceHistory && (
        <Modal title="سجل الحضور" onClose={() => setShowAttendanceHistory(false)} size="xl">
          {attendanceHistory.length === 0 ? (
            <p className="text-appSubtext" dir="rtl">لا يوجد سجل حضور.</p>
          ) : (
            <div className="overflow-x-auto" dir="rtl">
              <table className="w-full text-sm min-w-[900px]">
                <thead><tr className="text-appSubtext text-xs">
                  <th>التاريخ</th><th>وقت بدء العمل</th><th>موقع بدء العمل</th><th>وقت انتهاء العمل</th>
                  <th>موقع انتهاء العمل</th><th>مدة العمل</th><th>الحالة</th>
                </tr></thead>
                <tbody>{attendanceHistory.map(row => (
                  <tr key={row.id} className="border-t border-appBorder">
                    <td>{formatAttendanceDate(row.workDate)}</td>
                    <td>{formatAttendanceTime(row.startTime)}</td>
                    <td><AttendanceLocationLink latitude={row.startLatitude} longitude={row.startLongitude} accuracy={row.startAccuracy} /></td>
                    <td>{formatAttendanceTime(row.endTime)}</td>
                    <td><AttendanceLocationLink latitude={row.endLatitude} longitude={row.endLongitude} accuracy={row.endAccuracy} /></td>
                    <td>{formatWorkedMinutes(row.workedMinutes)}</td>
                    <td>{attendanceStatusLabel(row.status)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModel
          selectedTask={selectedTask}
          setTasks={setAssignedByTasks}
          setSelectedTask={setSelectedTask}
          onDelete={() => handleDeleteTask(selectedTask.id)}
          onAccept={() => handleAcceptTask(selectedTask.id)}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </MainLayout>
  );
}

export default EmployeeProfilePage;
