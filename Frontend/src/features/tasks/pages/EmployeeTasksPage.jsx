import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Plus, Flag, AlertTriangle,
  CheckCircle2, Circle, Loader2, ArrowRight,
  X, ChevronDown, GripVertical,
} from 'lucide-react';
import MainLayout from '../../../shared/layout/MainLayout';
import { Avatar, PriorityBadge, CardSkeleton, Modal } from '../../../shared/components/HrShared';
import { KANBAN_STAGES } from '../../../shared/data/hrMockData';
import { fetchUsers } from '../../../api/users';
import { fetchTasks, addTask, deleteTask } from '../../../api/tasks';

// ─── Helpers ────────────────────────────────────────────────────────────────
function daysRemaining(deadline) {
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

function DeadlinePill({ deadline }) {
  const days = daysRemaining(deadline);
  const cls =
    days < 0    ? 'bg-red-100 text-red-700'
    : days <= 2 ? 'bg-red-50 text-red-600'
    : days <= 5 ? 'bg-amber-50 text-amber-600'
    : 'bg-slate-100 text-appSubtext';
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>
      {days <= 2 && <AlertTriangle size={9} />}
      {label}
    </span>
  );
}

const STAGE_META = {
  'قائمة الانتظار':  { Icon: Circle,       color: 'text-appSubtext',   bg: 'bg-slate-100',   ring: 'ring-slate-300'   },
  'قيد التنفيذ':   { Icon: Loader2,      color: 'text-blue-500',     bg: 'bg-blue-100',    ring: 'ring-blue-300'    },
  'تحت المراجعة':  { Icon: ArrowRight,   color: 'text-amber-500',    bg: 'bg-amber-100',   ring: 'ring-amber-300'   },
  'مكتمل':        { Icon: CheckCircle2, color: 'text-emerald-500',  bg: 'bg-emerald-100', ring: 'ring-emerald-300' },
};

// ─── Task Card ──────────────────────────────────────────────────────────────
function TaskCard({ task, onMove, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const otherStages = KANBAN_STAGES.filter(s => s !== task.stage);

  return (
    <div className="bg-appSurface rounded-xl border border-appBorder p-4 hover:shadow-panel hover:-translate-y-0.5 transition-all duration-150 cursor-grab active:cursor-grabbing group relative">
      {/* Header row */}
      <div className="flex items-start justify-between mb-2.5">
        <GripVertical size={14} className="text-slate-300 group-hover:text-slate-400 mt-0.5 shrink-0" />
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1 rounded-lg text-slate-300 hover:text-appSubtext hover:bg-appMuted opacity-0 group-hover:opacity-100 transition-all"
          >
            <ChevronDown size={13} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-panel border border-appBorder py-1 min-w-[150px]">
              {otherStages.map(s => (
                <button key={s}
                  onClick={() => { onMove(task.id, s); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-appText hover:bg-appMuted transition-colors">
                  <ArrowRight size={11} className="text-appSubtext" />
                  Move to {s}
                </button>
              ))}
              <div className="border-t border-appBorder mt-1 pt-1">
                <button
                  onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-danger hover:bg-red-50 transition-colors">
                  <X size={11} /> Remove task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-appText mb-2.5 leading-snug pr-2">{task.title}</p>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <PriorityBadge priority={task.priority} />
        {task.deadline && <DeadlinePill deadline={task.deadline} />}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-appBorder">
        <Avatar initials={task.assignee} size="sm" />
        <p className="text-[11px] text-appSubtext truncate flex-1">{task.assigneeName}</p>
      </div>
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────
function KanbanColumn({ stage, tasks, onMove, onDelete, loading }) {
  const { Icon, color, bg, ring } = STAGE_META[stage];
  return (
    <div className="flex flex-col gap-3 bg-appMuted rounded-2xl p-3 min-w-[250px] flex-1">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-1">
        <Icon size={14} className={color} />
        <span className="text-[11px] font-bold text-appSubtext uppercase tracking-[0.14em] flex-1">{stage}</span>
        <span className={`w-5 h-5 rounded-full ring-2 ${ring} ${bg} flex items-center justify-center text-[10px] font-bold text-appText`}>
          {tasks.length}
        </span>
      </div>

      {loading
        ? <CardSkeleton count={2} />
        : tasks.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-appSubtext">
              <div className="w-10 h-10 bg-slate-200/80 rounded-xl flex items-center justify-center mb-2">
                <ClipboardList size={16} className="text-slate-400" />
              </div>
              <p className="text-xs">No tasks here</p>
            </div>
          )
          : tasks.map(t => (
            <TaskCard key={t.id} task={t} onMove={onMove} onDelete={onDelete} />
          ))
      }
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
const EMPTY_TASK = {
  title: '', assigneeName: '', priority: 'Medium', deadline: '', stage: 'قائمة الانتظار',
};

function EmployeeTasksPage() {
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY_TASK);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {

    const loadData = async () => {
      try {
        const [tasksData, employeesData] = await Promise.all([fetchTasks(), fetchUsers()]);
        setTasks(tasksData);
        setEmployees(employeesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const moveTask   = (id, stage) => setTasks(prev => prev.map(t => t.id === id ? { ...t, stage } : t));
  const removeTask = async (id)        => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      // ! optionally show a notification/error state here
    }
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.assigneeName) return;

    const emp = employees.find(e => e.name === form.assigneeName);

    const newTask = {
      id: `t${Date.now()}`,
      ...form,
      assignee: emp?.avatar ?? form.assigneeName.slice(0, 2).toUpperCase(),
    };

    try {
      const savedTask = await addTask(newTask);
      setTasks(prev => [...prev, savedTask]);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving task:', error);
      // ! optionally show a notification/error state here
    }
  };

  const tasksByStage = stage => tasks.filter(t => t.stage === stage);

  const totalDone = tasks.filter(t => t.stage === 'Completed').length;
  const highPrio  = tasks.filter(t => t.priority === 'High').length;
  const overdue   = tasks.filter(t => daysRemaining(t.deadline) < 0 && t.stage !== 'Completed').length;

  const inputCls = 'w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all';

  const actions = (
    <button
      onClick={() => { setForm(EMPTY_TASK); setShowForm(true); }}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-brandDeep active:scale-[0.98] transition-all"
    >
      <Plus size={15} /> New Task
    </button>
  );

  return (
    <MainLayout title="Employee Tasks" subtitle="Personnel Workflow" actions={actions}>
      <div className="space-y-5">

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Tasks',   value: tasks.length,  Icon: ClipboardList, colorClass: 'bg-blue-50 text-brand' },
            { label: 'Completed',     value: totalDone,     Icon: CheckCircle2,  colorClass: 'bg-emerald-50 text-emerald-600' },
            { label: 'High Priority', value: highPrio,      Icon: Flag,          colorClass: 'bg-red-50 text-danger' },
            { label: 'Overdue',       value: overdue,       Icon: AlertTriangle, colorClass: 'bg-amber-50 text-amber-600' },
          ].map(s => (
            <div key={s.label} className="bg-appSurface rounded-2xl border border-appBorder p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.colorClass}`}>
                <s.Icon size={16} />
              </div>
              <div>
                <p className="text-xl font-extrabold font-display text-appText">{loading ? '—' : s.value}</p>
                <p className="text-[11px] text-appSubtext">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
          {KANBAN_STAGES.map(stage => (
            <KanbanColumn
              key={stage}
              stage={stage}
              tasks={tasksByStage(stage)}
              onMove={moveTask}
              onDelete={removeTask}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* New Task Modal */}
      {showForm && (
        <Modal
          title="Create New Task"
          onClose={() => setShowForm(false)}
          footer={
            <>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-appSubtext bg-white border border-appBorder rounded-xl hover:bg-appMuted transition-colors">
                Cancel
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep transition-colors">
                Create Task
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">Task Title *</label>
              <input className={inputCls} placeholder="Describe the task…" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">Assigned Employee</label>
                <select className={inputCls} value={form.assigneeName}
                  onChange={e => setForm(p => ({ ...p, assigneeName: e.target.value }))}>
                  <option value="">Select employee…</option>
                  {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">Priority</label>
                <select className={inputCls} value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">Stage</label>
                <select className={inputCls} value={form.stage}
                  onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}>
                  {KANBAN_STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">Deadline</label>
                <input type="date" className={inputCls} value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

export default EmployeeTasksPage;
