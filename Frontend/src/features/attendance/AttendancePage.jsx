import React, { useEffect, useState } from 'react';
import MainLayout from '../../shared/layout/MainLayout';
import { Modal } from '../../shared/components/HrShared';
import { getToday, getEmployeeHistory } from '../../api/attendance';
import AttendanceLocationLink from './AttendanceLocationLink';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  if (minutes == null) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} دقيقة`;
  if (!rest) return `${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
  return `${hours} ${hours === 1 ? 'ساعة' : 'ساعات'} و ${rest} دقيقة`;
}

function statusLabel(status) {
  return { NOT_STARTED: 'لم يبدأ', WORKING: 'يعمل الآن', COMPLETED: 'تم الانتهاء' }[status] || 'غير متاح';
}

function AttendanceDetails({ row }) {
  return (
    <>
      <td>{formatDate(row.workDate)}</td>
      <td>{formatTime(row.startTime)}</td>
      <td><AttendanceLocationLink latitude={row.startLatitude} longitude={row.startLongitude} accuracy={row.startAccuracy} /></td>
      <td>{formatTime(row.endTime)}</td>
      <td><AttendanceLocationLink latitude={row.endLatitude} longitude={row.endLongitude} accuracy={row.endAccuracy} /></td>
      <td>{formatDuration(row.workedMinutes)}</td>
      <td>{statusLabel(row.status)}</td>
    </>
  );
}

function AttendancePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setRows(await getToday());
      } catch (e) {
        setError(e?.response?.status === 403 ? 'ليس لديك صلاحية للوصول إلى هذه البيانات.' : 'تعذر تحميل بيانات الحضور.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openEmployee = async (employee) => {
    setSelectedEmployee(employee);
    try {
      setHistory(await getEmployeeHistory(employee.userId) || []);
    } catch {
      setHistory([]);
      setError('تعذر تحميل سجل الحضور.');
    }
  };

  return (
    <MainLayout title="الحضور والانصراف" subtitle="سجل حضور الموظفين">
      <div className="bg-appSurface border border-appBorder rounded-2xl p-6" dir="rtl">
        {loading ? <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand" /> : error ? (
          <p className="text-red-600 font-semibold">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-appSubtext">لا توجد بيانات حضور.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1050px]">
              <thead><tr className="text-appSubtext text-xs">
                <th className="text-start">الموظف</th><th>الحالة</th><th>وقت بدء العمل</th><th>موقع بدء العمل</th>
                <th>وقت انتهاء العمل</th><th>موقع انتهاء العمل</th><th>مدة العمل</th><th>الإجراءات</th>
              </tr></thead>
              <tbody>{rows.map(row => (
                <tr key={row.userId} className="border-t border-appBorder">
                  <td className="py-3">{row.employeeName}</td>
                  <td>{statusLabel(row.status)}</td><td>{formatTime(row.startTime)}</td>
                  <td><AttendanceLocationLink latitude={row.startLatitude} longitude={row.startLongitude} accuracy={row.startAccuracy} /></td>
                  <td>{formatTime(row.endTime)}</td>
                  <td><AttendanceLocationLink latitude={row.endLatitude} longitude={row.endLongitude} accuracy={row.endAccuracy} /></td>
                  <td>{formatDuration(row.workedMinutes)}</td>
                  <td><button type="button" onClick={() => openEmployee(row)} className="text-brand font-semibold hover:underline">سجل الحضور</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
      {selectedEmployee && (
        <Modal title={`سجل حضور ${selectedEmployee.employeeName}`} onClose={() => { setSelectedEmployee(null); setHistory([]); }} size="xl">
          {history.length === 0 ? <p className="text-appSubtext">لا يوجد سجل حضور.</p> : (
            <div className="overflow-x-auto" dir="rtl">
              <table className="w-full text-sm min-w-[900px]">
                <thead><tr className="text-appSubtext text-xs">
                  <th>التاريخ</th><th>وقت بدء العمل</th><th>موقع بدء العمل</th><th>وقت انتهاء العمل</th>
                  <th>موقع انتهاء العمل</th><th>مدة العمل</th><th>الحالة</th>
                </tr></thead>
                <tbody>{history.map(row => <tr key={row.id} className="border-t border-appBorder"><AttendanceDetails row={row} /></tr>)}</tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </MainLayout>
  );
}

export default AttendancePage;
