import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Mail, Phone, Calendar, Building2, Briefcase,
  Edit, Save, X, AlertCircle, CheckCircle,
} from 'lucide-react';
import MainLayout from '../../../shared/layout/MainLayout';
import {
  Avatar, StatusBadge, Modal,
} from '../../../shared/components/HrShared';
import { fetchEmployees, getEmployeeById, updateEmployee, deleteEmployee } from '../../../api/employees';

function inputCls() {
  return 'w-full ps-3 pe-3 py-2 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all';
}

function selectCls() {
  return 'w-full ps-3 pe-3 py-2 bg-appMuted border border-appBorder rounded-xl text-sm text-appText appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all';
}

const STATUSES = ['نشط', 'في إجازة', 'منتهي الخدمة'];

function EmployeeProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        setLoading(true);
        // If id is provided in URL params, fetch that specific employee, otherwise fetch all and use the first one
        let current;
        if (id) {
          current = await getEmployeeById(id);
        } else {
          const employees = await fetchEmployees();
          current = employees[0];
        }
        
        if (current) {
          setEmployee(current);
          setFormData(current);
        } else {
          setError('الموظف غير موجود');
        }
      } catch (err) {
        setError('خطأ في تحميل بيانات الموظف');
        console.error('Error loading employee:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEmployee();
  }, [id]);

  const handleEdit = () => {
    setFormData({ ...employee });
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
    setError(null);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.name?.trim()) {
        setError('الاسم مطلوب');
        return;
      }
      if (!formData.email?.trim()) {
        setError('البريد الإلكتروني مطلوب');
        return;
      }

      setSaving(true);
      await updateEmployee(employee.id, formData);
      
      setEmployee({ ...formData });
      setIsEditing(false);
      setSuccessMessage('تم تحديث البيانات بنجاح');
      setTimeout(() => setSuccessMessage(''), 3000);
      setError(null);
    } catch (err) {
      setError('خطأ في تحديث البيانات');
      console.error('Error saving employee:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await deleteEmployee(employee.id);
      setShowDeleteModal(false);
      setSuccessMessage('تم حذف الموظف بنجاح');
      setTimeout(() => {
        navigate('/EmployeeManagement');
      }, 2000);
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

  const actions = (
    <div className="flex items-center gap-2">
      {!isEditing && (
        <button
          onClick={handleEdit}
          className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brandDeep active:scale-[0.98] transition-all"
        >
          <Edit size={15} /> تعديل
        </button>
      )}
      {isEditing && (
        <>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            <Save size={15} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
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
        
        {/* Success Message */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600" />
            <p className="text-emerald-700 font-semibold text-sm">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-600" />
            <p className="text-red-700 font-semibold text-sm">{error}</p>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-gradient-to-r from-brand/10 to-brand/5 border border-brand/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-end gap-6">
          <Avatar initials={employee.avatar} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-appText">{employee.name}</h2>
              <StatusBadge status={employee.status} />
            </div>
            <p className="text-appSubtext text-sm mb-1">{employee.role}</p>
            <p className="text-appSubtext text-xs flex items-center gap-1">
              <Building2 size={12} /> {employee.dept}
            </p>
          </div>
        </div>

        {/* Main Content */}
        {!isEditing ? (
          // View Mode
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div className="bg-appSurface border border-appBorder rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-appSubtext mb-5">
                معلومات الاتصال
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                    <Mail size={14} /> البريد الإلكتروني
                  </label>
                  <a href={`mailto:${employee.email}`}
                    className="text-brand hover:underline text-sm font-medium">
                    {employee.email}
                  </a>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                    <Phone size={14} /> رقم الهاتف
                  </label>
                  <a href={`tel:${employee.phone}`}
                    className="text-brand hover:underline text-sm font-medium">
                    {employee.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Work Information */}
            <div className="bg-appSurface border border-appBorder rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-appSubtext mb-5">
                معلومات العمل
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                    <Briefcase size={14} /> المسمى الوظيفي
                  </label>
                  <p className="text-appText text-sm font-medium">{employee.role}</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                    <Building2 size={14} /> القسم
                  </label>
                  <p className="text-appText text-sm font-medium">{employee.dept}</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-appSubtext text-xs font-semibold mb-2">
                    <Calendar size={14} /> تاريخ التعيين
                  </label>
                  <p className="text-appText text-sm font-medium" dir="ltr">
                    {new Date(employee.hireDate).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="bg-appSurface border border-appBorder rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-appSubtext mb-6">
              تعديل بيانات الموظف
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="block text-appSubtext text-xs font-semibold mb-2">
                  الاسم *
                </label>
                <input
                  type="text"
                  className={inputCls()}
                  value={formData.name || ''}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="الاسم الكامل"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-appSubtext text-xs font-semibold mb-2">
                  البريد الإلكتروني *
                </label>
                <input
                  type="email"
                  className={inputCls()}
                  value={formData.email || ''}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder="example@domain.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-appSubtext text-xs font-semibold mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  className={inputCls()}
                  value={formData.phone || ''}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="+966"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-appSubtext text-xs font-semibold mb-2">
                  المسمى الوظيفي
                </label>
                <input
                  type="text"
                  className={inputCls()}
                  value={formData.role || ''}
                  onChange={e => handleInputChange('role', e.target.value)}
                  placeholder="المسمى الوظيفي"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-appSubtext text-xs font-semibold mb-2">
                  القسم
                </label>
                <input
                  type="text"
                  className={inputCls()}
                  value={formData.dept || ''}
                  onChange={e => handleInputChange('dept', e.target.value)}
                  placeholder="القسم"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-appSubtext text-xs font-semibold mb-2">
                  الحالة
                </label>
                <select
                  className={selectCls()}
                  value={formData.status || ''}
                  onChange={e => handleInputChange('status', e.target.value)}
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hire Date */}
              <div className="md:col-span-2">
                <label className="block text-appSubtext text-xs font-semibold mb-2">
                  تاريخ التعيين
                </label>
                <input
                  type="date"
                  className={inputCls()}
                  value={formData.hireDate ? formData.hireDate.split('T')[0] : ''}
                  onChange={e => handleInputChange('hireDate', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        {!isEditing && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-red-700 mb-4">
              منطقة الخطر
            </h3>
            <p className="text-red-600 text-sm mb-4">
              سيؤدي حذف هذا الموظف إلى إزالة جميع بيانات الموظف بشكل دائم.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-2 ps-4 pe-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all"
            >
              حذف الموظف
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          title="تأكيد حذف الموظف"
          onClose={() => setShowDeleteModal(false)}
          footer={
            <>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={saving}
                className="ps-4 pe-4 py-2 text-appText font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="ps-4 pe-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'جاري الحذف...' : 'حذف'}
              </button>
            </>
          }
        >
          <p className="text-appSubtext mb-4">
            هل أنت متأكد من رغبتك في حذف {employee.name}؟ 
            <br />
            لا يمكن التراجع عن هذا الإجراء.
          </p>
        </Modal>
      )}
    </MainLayout>
  );
}

export default EmployeeProfilePage;
