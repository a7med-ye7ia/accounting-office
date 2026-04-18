import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Users, Pencil, Trash2,
  AlertCircle, TrendingUp,
} from 'lucide-react';
import MainLayout from '../../../shared/layout/MainLayout';
import {
  BudgetBar, Modal, StatusBadge, TableSkeleton,
} from '../../../components/shared/HrShared';
import { HR_DEPARTMENTS } from '../../../data/hrMockData';

const EMPTY_FORM = { name: '', head: '', budget: '', description: '' };

function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="bg-appSurface rounded-2xl border border-appBorder p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-extrabold font-display text-appText">{value}</p>
        <p className="text-xs text-appSubtext mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function DepartmentsPage() {
  const [depts, setDepts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [deleteId, setDeleteId]   = useState(null);

  // Simulate API fetch with skeleton
  useEffect(() => {
    const t = setTimeout(() => { setDepts(HR_DEPARTMENTS); setLoading(false); }, 1200);
    return () => clearTimeout(t);
  }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditItem(null); setShowModal(true); };
  const openEdit   = d  => {
    setForm({ name: d.name, head: d.head, budget: String(d.budget), description: '' });
    setEditItem(d);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editItem) {
      setDepts(prev => prev.map(d =>
        d.id === editItem.id
          ? { ...d, name: form.name, head: form.head, budget: Number(form.budget) || d.budget }
          : d
      ));
    } else {
      setDepts(prev => [...prev, {
        id: Date.now(), name: form.name, head: form.head,
        budget: Number(form.budget) || 0, used: 0, staff: 0, status: 'Active',
      }]);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    setDepts(prev => prev.filter(d => d.id !== deleteId));
    setDeleteId(null);
  };

  const totalStaff  = depts.reduce((a, d) => a + d.staff, 0);
  const activeDepts = depts.filter(d => d.status === 'Active').length;

  const actions = (
    <button
      onClick={openCreate}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brandDeep active:scale-[0.98] transition-all"
    >
      <Plus size={15} /> New Department
    </button>
  );

  return (
    <MainLayout title="Departments" subtitle="Internal Organization" actions={actions}>
      <div className="space-y-6">

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Building2}  label="Total Departments" value={loading ? '—' : depts.length}  colorClass="bg-blue-50 text-brand" />
          <StatCard icon={Users}       label="Total Staff"       value={loading ? '—' : totalStaff}    colorClass="bg-emerald-50 text-emerald-600" />
          <StatCard icon={TrendingUp}  label="Active Units"      value={loading ? '—' : activeDepts}   colorClass="bg-amber-50 text-amber-600" />
        </div>

        {/* Table Card */}
        <div className="bg-appSurface rounded-2xl border border-appBorder overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-appBorder">
            <h2 className="font-semibold text-appText">All Departments</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-badgeBlueBg text-badgeBlueText">
              {depts.length} total
            </span>
          </div>

          {/* Empty State */}
          {!loading && depts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Building2 size={28} className="text-slate-400" />
              </div>
              <h3 className="font-semibold text-appText text-sm">No departments yet</h3>
              <p className="text-xs text-appSubtext mt-1 max-w-xs">
                Get started by creating your first department to organise your workforce.
              </p>
              <button onClick={openCreate}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brandDeep transition-colors">
                <Plus size={14} /> Create Department
              </button>
            </div>
          )}

          {/* Data Table */}
          {(loading || depts.length > 0) && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-appBorder">
                    {['Department', 'Head of Dept', 'Staff Count', 'Budget Utilisation', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                {loading
                  ? <TableSkeleton rows={5} cols={6} />
                  : (
                    <tbody>
                      {depts.map(d => (
                        <tr key={d.id} className="border-b border-slate-100 hover:bg-appMuted transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Building2 size={14} className="text-brand" />
                              </div>
                              <span className="font-semibold text-appText">{d.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-appSubtext">{d.head}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              <Users size={13} className="text-slate-400" />
                              <span className="font-medium text-appText">{d.staff}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <BudgetBar used={d.used} total={d.budget} />
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={d.status} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEdit(d)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-blue-50 transition-colors">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => setDeleteId(d.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-red-50 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )
                }
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editItem ? 'Edit Department' : 'Create Department'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-appSubtext bg-white border border-appBorder rounded-xl hover:bg-appMuted transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep transition-colors">
                {editItem ? 'Save Changes' : 'Create Department'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                Department Name *
              </label>
              <input className="w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="e.g. Engineering" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                Head of Department
              </label>
              <input className="w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="Full name" value={form.head}
                onChange={e => setForm(p => ({ ...p, head: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                Annual Budget (USD)
              </label>
              <input type="number" className="w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                placeholder="e.g. 500000" value={form.budget}
                onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                Description
              </label>
              <textarea rows={3} className="w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none"
                placeholder="Optional notes…" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <Modal
          title="Delete Department"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-appSubtext bg-white border border-appBorder rounded-xl hover:bg-appMuted transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-danger rounded-xl hover:bg-red-700 transition-colors">
                Delete
              </button>
            </>
          }
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle size={18} className="text-danger" />
            </div>
            <div>
              <p className="text-sm font-medium text-appText">Delete this department?</p>
              <p className="text-xs text-appSubtext mt-1">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

export default DepartmentsPage;
