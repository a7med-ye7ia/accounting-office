import React, { useState } from 'react';
import { Modal } from '../../../shared/components/HrShared';
import { toDateTimeLocal } from '../../../utils/dateFormat';

const getInitialForm = (initial, defaultAssignedToId) => ({
  title: initial?.title || '',
  description: initial?.description || '',
  assignedToId: String(initial?.assignedToId || defaultAssignedToId || ''),
  dueDate: toDateTimeLocal(initial?.dueDate),
});

export default function SubtaskFormModal({
  title = 'إضافة مهمة فرعية',
  employees,
  defaultAssignedToId,
  initial,
  submitting,
  error,
  confirmLabel = 'إضافة',
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() => getInitialForm(initial, defaultAssignedToId));
  const [errors, setErrors] = useState({});

  const inputCls = 'w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-appSubtext/80 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ui-transition';

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'العنوان مطلوب';
    if (!form.assignedToId) next.assignedToId = 'الموظف مطلوب';
    if (!form.dueDate) next.dueDate = 'موعد التسليم مطلوب';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      title: form.title.trim(),
      description: form.description,
      assignedToId: parseInt(form.assignedToId, 10),
      dueDate: form.dueDate,
    });
  };

  return (
    <Modal
      title={title}
      size="sm"
      busy={submitting}
      onClose={() => { if (!submitting) onClose(); }}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-appText bg-appMuted border border-appBorder rounded-xl hover:bg-appBorder/30 ui-transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep ui-transition shadow-panel"
          >
            {submitting ? 'جاري الحفظ...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="space-y-4" dir="rtl">
        {error && (
          <p className="text-sm text-danger bg-badgeRedBg border border-appBorder rounded-xl px-3 py-2">{error}</p>
        )}
        <div>
          <label className="block text-[11px] font-bold text-appSubtext mb-1.5">العنوان *</label>
          <input className={inputCls} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-bold text-appSubtext mb-1.5">الوصف</label>
          <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-appSubtext mb-1.5">الموظف *</label>
          <select className={inputCls} value={form.assignedToId} onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))}>
            <option value="">اختر موظف</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.fullName}</option>
            ))}
          </select>
          {errors.assignedToId && <p className="text-xs text-danger mt-1">{errors.assignedToId}</p>}
        </div>
        <div>
          <label className="block text-[11px] font-bold text-appSubtext mb-1.5">موعد التسليم *</label>
          <DateTimeConfirmField
            value={form.dueDate}
            onChange={value => setForm(p => ({ ...p, dueDate: value }))}
            inputClassName={inputCls}
          />
          {errors.dueDate && <p className="text-xs text-danger mt-1">{errors.dueDate}</p>}
        </div>
      </div>
    </Modal>
  );
}

export function DateTimeConfirmField({
  value,
  onChange,
  inputClassName,
  placeholder = 'اختر التاريخ والوقت',
}) {
  const [open, setOpen] = useState(false);
  const displayValue = value ? new Date(value).toLocaleString('ar-EG') : '';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${inputClassName} min-h-[42px] text-right`}
      >
        {displayValue || <span className="text-appSubtext/80">{placeholder}</span>}
      </button>
      {open && (
        <DateTimePickerModal
          value={value}
          onCancel={() => setOpen(false)}
          onConfirm={(nextValue) => {
            onChange(nextValue);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function DateTimePickerModal({ value, onCancel, onConfirm }) {
  const initial = toDateTimeLocal(value);
  const [date, setDate] = useState(initial.slice(0, 10));
  const [time, setTime] = useState(initial.slice(11, 16));
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!date || !time) {
      setError('التاريخ والوقت مطلوبان');
      return;
    }
    onConfirm(`${date}T${time}`);
  };

  const inputCls = 'w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-appSubtext/80 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ui-transition';

  return (
    <Modal
      title="اختيار موعد التسليم"
      size="sm"
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-appText bg-appMuted border border-appBorder rounded-xl hover:bg-appBorder/30 ui-transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep ui-transition shadow-panel"
          >
            تأكيد الموعد
          </button>
        </>
      }
    >
      <div className="space-y-4" dir="rtl">
        {error && (
          <p className="text-sm text-danger bg-badgeRedBg border border-appBorder rounded-xl px-3 py-2">{error}</p>
        )}
        <div>
          <label className="block text-[11px] font-bold text-appSubtext mb-1.5">التاريخ</label>
          <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-appSubtext mb-1.5">الوقت</label>
          <input type="time" className={inputCls} value={time} onChange={e => setTime(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

