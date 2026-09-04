import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Plus, AlertTriangle,
  CheckCircle2, Circle, Loader2
} from 'lucide-react';
import { useLocation } from "react-router-dom";
import MainLayout from '../../../shared/layout/MainLayout';
import { Avatar, CardSkeleton } from '../../../shared/components/HrShared';
import TaskDetailsModel from './TaskDetailsModel';
import { Modal } from '../../../shared/components/HrShared';
import { KANBAN_STAGES } from '../../../shared/data/hrMockData';
import { fetchUsers } from '../../../api/users';
import { fetchTasks, addTask, deleteTask, updateTask, updateTaskStatus } from '../../../api/tasks';
import { fetchCompanies } from '../../../api/companies';
import { fetchBranches } from '../../../api/branches';
import { fetchDepartments } from '../../../api/departments';
import {
  isOwner,
  isBranchManager,
  isDepartmentManager,
  isEmployee,
  canCreateTask,
  canEditTask,
  canDeleteTask,
  canChangeTaskStatus
} from '../../../utils/roles';

// ─── Status Mapping ────────────────────────────────────────────────────────
const STATUS_TO_ARABIC = {
  'PENDING': 'قائمة الانتظار',
  'IN_PROGRESS': 'قيد التنفيذ',
  'DONE': 'مكتمل',
};

const ARABIC_TO_STATUS = {
  'قائمة الانتظار': 'PENDING',
  'قيد التنفيذ': 'IN_PROGRESS',
  'مكتمل': 'DONE',
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function daysRemaining(dueDate) {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate) - new Date()) / 86400000);
}

function DeadlinePill({ dueDate }) {
  const days = daysRemaining(dueDate);
  if (!days) return null;
  const cls =
    days < 0
      ? "bg-badgeRedBg text-badgeRedText border border-appBorder"
      : days <= 2
        ? "bg-badgeRedBg/80 text-danger border border-appBorder"
        : days <= 5
          ? "bg-badgePurpleBg text-badgePurpleText border border-appBorder"
          : "bg-badgeGrayBg text-badgeGrayText border border-appBorder";
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}>
      {days <= 2 && <AlertTriangle size={9} />}
      {label}
    </span>
  );
}

const STAGE_META = {
  PENDING: { Icon: Circle, color: "text-appSubtext", bg: "bg-badgeGrayBg", ring: "ring-appBorder" },
  IN_PROGRESS: { Icon: Loader2, color: "text-badgeBlueText", bg: "bg-badgeBlueBg", ring: "ring-brand/30" },
  DONE: { Icon: CheckCircle2, color: "text-success", bg: "bg-success/15", ring: "ring-success/40" },
};

// ─── Task Card ──────────────────────────────────────────────────────────────
function TaskCard({ task, onMove, onDelete, onOpen }) {
  // ! const [menuOpen, setMenuOpen] = useState(false);
  const [showDesc, setShowDesc] = useState(false);

  const KANBAN_STAGES = ['PENDING', 'IN_PROGRESS', /*'REVIEW',*/ 'DONE'];
  const otherStages = KANBAN_STAGES.filter(s => s !== task.status);

  return (
    <div
      onClick={() => onOpen(task)}
      className="bg-appSurface rounded-2xl border border-appBorder shadow-panel p-4 hover:border-brand/20 hover:-translate-y-0.5 ui-transition cursor-grab active:cursor-grabbing group relative"
    >
      {/* Title */}
      <p className="text-sm font-semibold text-appText mb-1 leading-snug pr-2">{task.title}</p>
      {task.companyName && (
        <p className="text-xs text-brand font-medium mb-2 truncate">
          🏢 {task.companyName}
        </p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {task.dueDate && <DeadlinePill dueDate={task.dueDate} />}
      </div>

      <div className="flex items-center gap-2 mt-3 mb-2">
        {task.status === 'PENDING' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove(task.id, 'IN_PROGRESS')
            }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] bg-badgeBlueBg text-badgeBlueText rounded-lg border border-appBorder hover:bg-badgeBlueBg/80 ui-transition"
          >
            بدءالعمل
          </button>
        )}

        {task.status === 'IN_PROGRESS' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMove(task.id, 'PENDING')
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-appMuted text-appSubtext rounded-lg border border-appBorder hover:bg-appBorder/40 ui-transition"
            >
              وضع في قائمة الانتظار
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onMove(task.id, 'DONE')
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-success/15 text-success rounded-lg border border-appBorder hover:bg-success/25 ui-transition"
            >
              <CheckCircle2 size={11} />
              تم الانتهاء
            </button>
          </>
        )}

        {task.status === 'DONE' && (
          <span className={`text-[11px] px-2 py-1 rounded-lg font-medium border border-appBorder ${task.reviewed ? "bg-success/15 text-success" : "bg-badgePurpleBg text-badgePurpleText"
            }`}>
            {task.reviewed ? 'تمت المراجعة' : 'بانتظار المراجعة'}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-appBorder">
        <Avatar initials={task.assignedToName?.slice(0, 2).toUpperCase() || '?'} size="sm" />
        <p className="text-[11px] text-appSubtext truncate flex-1">{task.assignedToName || 'Unassigned'}</p>
      </div>
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────
function KanbanColumn({ status, tasks, onMove, onDelete, loading, setSelectedTask }) {
  const { Icon, color, bg, ring } = STAGE_META[status];
  const arabicLabel = STATUS_TO_ARABIC[status];
  return (
    <div className="flex flex-col gap-4 bg-appMuted/60 rounded-2xl border border-appBorder p-4 min-w-[250px] flex-1 shadow-inner">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-1">
        <Icon size={14} className={color} />
        <span className="text-[11px] font-bold text-appSubtext uppercase tracking-[0.14em] flex-1">{arabicLabel}</span>
        <span className={`w-5 h-5 rounded-full ring-2 ${ring} ${bg} flex items-center justify-center text-[10px] font-bold text-appText`}>
          {tasks.length}
        </span>
      </div>

      {loading
        ? <CardSkeleton count={2} />
        : tasks.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-appSubtext">
              <div className="w-10 h-10 bg-appBorder/50 rounded-xl flex items-center justify-center mb-2 border border-appBorder">
                <ClipboardList size={16} className="text-appSubtext" />
              </div>
              <p className="text-xs">No tasks here</p>
            </div>
          )
          : tasks.map(t => (
            <TaskCard key={t.id} task={t} onMove={onMove} onDelete={onDelete} onOpen={setSelectedTask} />
          ))
      }
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
const EMPTY_TASK = {
  title: '', assignedToId: '', companyId: '', targetBranchId: '', targetDepartmentId: '', dueDate: '', status: 'PENDING', description: ''
};

function AddCommentBox({ task, setTasks }) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;

    const newComment = {
      message: text,
      createdById: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 1, // ! hardcoded for now
      taskId: task.id,
    };

    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, comments: [...(t.comments || []), newComment] }
          : t
      )
    );

    task.comments = [...(task.comments || []), newComment];

    try {
      addCommentToTask(newComment);
    } catch (error) {
      console.error('Error adding comment:', error);
      // ! optionally show a notification/error state here
    }

    setText('');
  };

  return (
    <div className="mt-3 flex gap-2">
      <input
        className="flex-1 px-2 py-1 text-xs border rounded-lg"
        placeholder="اكتب تعليق..."
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        onClick={handleAdd}
        className="px-3 py-1 text-xs bg-brand text-white rounded-lg"
      >
        ارسال
      </button>
    </div>
  );
}

function EmployeeTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TASK);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saveSubmitting, setSaveSubmitting] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch (e) {
      return null;
    }
  })();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allTasks, employeesData, companiesData, branchesData, departmentsData] = await Promise.all([
          fetchTasks(),
          fetchUsers(),
          fetchCompanies().catch(err => {
            console.error('Error loading companies:', err);
            return [];
          }),
          fetchBranches().catch(err => {
            console.error('Error loading branches:', err);
            return [];
          }),
          fetchDepartments().catch(err => {
            console.error('Error loading departments:', err);
            return [];
          })
        ]);

        setTasks(allTasks || []);
        setEmployees(employeesData || []);
        setCompanies(companiesData || []);
        setBranches(branchesData || []);
        setDepartments(departmentsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const location = useLocation();
  useEffect(() => {
    const taskId = location.state?.openTaskId;

    if (!taskId || tasks.length === 0) return;

    const task = tasks.find(
      t => t.id === taskId
    );

    if (task) {
      setSelectedTask(task);
    }

  }, [tasks, location.state]);

  const moveTask = async (id, newStatus) => {
    try {
      await updateTaskStatus(id, newStatus);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error updating task status:', error);
      alert(error.response?.data?.message || 'غير مسموح لك بتغيير حالة هذه المهمة');
    }
  };

  const removeTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(error.response?.data?.message || 'فشل حذف المهمة');
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.assignedToId || !form.companyId) {
      alert('يرجى تحديد عنوان المهمة والشركة التابعة لها والموظف المسؤول');
      return;
    }

    setSaveSubmitting(true);

    const newTask = {
      title: form.title,
      description: form.description,
      status: form.status,
      dueDate: form.dueDate || null,
      assignedToId: parseInt(form.assignedToId, 10),
      companyId: parseInt(form.companyId, 10),
    };

    try {
      const savedTask = await addTask(newTask);
      setTasks(prev => [...prev, savedTask]);
      setShowForm(false);
      setForm(EMPTY_TASK);
    } catch (error) {
      console.error('Error saving task:', error);
      alert(error.response?.data?.message || 'فشل إضافة المهمة');
    } finally {
      setSaveSubmitting(false);
    }
  };

  // Available Branches for task assignment
  const availableBranches = useMemo(() => {
    if (isOwner(currentUser)) {
      return branches;
    }
    if (currentUser?.branchId) {
      return branches.filter(b => b.id === currentUser.branchId);
    }
    return branches;
  }, [branches, currentUser]);

  // Available Departments based on selected target branch
  const availableDepartments = useMemo(() => {
    if (!form.targetBranchId) return [];
    let list = departments.filter(d => (d.branch?.id || d.branchId) === Number(form.targetBranchId));
    if (isDepartmentManager(currentUser)) {
      if (Array.isArray(currentUser.managedDepartmentIds) && currentUser.managedDepartmentIds.length > 0) {
        list = list.filter(d => currentUser.managedDepartmentIds.includes(d.id));
      } else if (currentUser.departmentId) {
        list = list.filter(d => d.id === currentUser.departmentId);
      }
    }
    return list;
  }, [departments, form.targetBranchId, currentUser]);

  // Available Employees based on target branch & target department
  const availableEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (form.targetBranchId) {
        const empBranchId = emp.branchId || emp.branch?.id;
        if (empBranchId !== Number(form.targetBranchId)) return false;
      }
      if (form.targetDepartmentId) {
        const empDeptId = emp.departmentId || emp.department?.id;
        if (empDeptId !== Number(form.targetDepartmentId)) return false;
      }
      return true;
    });
  }, [employees, form.targetBranchId, form.targetDepartmentId]);

  const openCreateTask = () => {
    let initBranch = '';
    let initDept = '';
    if (isBranchManager(currentUser) || isDepartmentManager(currentUser)) {
      initBranch = currentUser?.branchId ? String(currentUser.branchId) : '';
    }
    if (isDepartmentManager(currentUser)) {
      initDept = currentUser?.departmentId ? String(currentUser.departmentId) : '';
    }
    setForm({
      ...EMPTY_TASK,
      targetBranchId: initBranch,
      targetDepartmentId: initDept,
    });
    setShowForm(true);
  };

  const KANBAN_STAGES = ['PENDING', 'IN_PROGRESS', /*'REVIEW',*/ 'DONE'];
  const tasksByStatus = status => tasks.filter(t => t.status === status);

  const totalDone = tasks.filter(t => t.status === 'DONE').length;
  const overdue = tasks.filter(t => daysRemaining(t.dueDate) < 0 && t.status !== 'DONE').length;

  const inputCls = 'w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-appSubtext/80 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ui-transition';

  const actions = (
    <button
      onClick={openCreateTask}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-panel hover:bg-brandDeep active:scale-[0.98] ui-transition"
    >
      <Plus size={15} /> اضافة مهمة جديدة
    </button>
  );

  return (
    <MainLayout title="مهامي" subtitle="" actions={!canCreateTask(currentUser) ? null : actions}>
      <div className="space-y-5">

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'العدد الكلي للمهمات', value: tasks.length, Icon: ClipboardList, colorClass: 'bg-badgeBlueBg text-badgeBlueText' },
            { label: 'عدد المهمات المكتملة', value: totalDone, Icon: CheckCircle2, colorClass: 'bg-success/15 text-success' },
            { label: 'عدد المهمات المتأخرة', value: overdue, Icon: AlertTriangle, colorClass: 'bg-badgeRedBg text-badgeRedText' },
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
          {KANBAN_STAGES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              onMove={moveTask}
              onDelete={removeTask}
              loading={loading}
              setSelectedTask={setSelectedTask}
            />
          ))}
        </div>
      </div>

      {/* New Task Modal */}
      {showForm && (
        <Modal
          title="اضافة مهمة جديدة"
          onClose={() => {
            if (!saveSubmitting) setShowForm(false);
          }}
          footer={
            <>
              <button onClick={() => setShowForm(false)} disabled={saveSubmitting}
                className="px-4 py-2 text-sm font-medium text-appText bg-appMuted border border-appBorder rounded-xl hover:bg-appBorder/30 ui-transition">
                الغاء
              </button>
              <button onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep ui-transition shadow-panel">
                {saveSubmitting ? "جاري الإضافة..." : "اضافة"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">عنوان المهمة</label>
              <input className={inputCls} placeholder="اكتب عنوان للمهمة..." value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                وصف المهمة
              </label>

              <textarea
                className={inputCls}
                placeholder="اكتب وصف المهمة..."
                value={form.description}
                onChange={e =>
                  setForm(p => ({ ...p, description: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الشركة التابعة لها المهمة *</label>
              <select className={inputCls} value={form.companyId}
                onChange={e => setForm(p => ({ ...p, companyId: e.target.value }))}>
                <option value="">اختر الشركة</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.company_name || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                الفرع المستهدف (لتحديد الموظف فقط - لا يغير فرع الشركة)
              </label>
              <select
                className={inputCls}
                value={form.targetBranchId}
                disabled={isBranchManager(currentUser) || isDepartmentManager(currentUser)}
                onChange={e => setForm(p => ({
                  ...p,
                  targetBranchId: e.target.value,
                  targetDepartmentId: '',
                  assignedToId: '',
                }))}
              >
                <option value="">{isOwner(currentUser) ? "جميع الفروع / اختر فرع" : "اختر الفرع"}</option>
                {availableBranches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                القسم المستهدف (لتحديد الموظف فقط)
              </label>
              <select
                className={inputCls}
                value={form.targetDepartmentId}
                disabled={!form.targetBranchId && !isDepartmentManager(currentUser)}
                onChange={e => setForm(p => ({
                  ...p,
                  targetDepartmentId: e.target.value,
                  assignedToId: '',
                }))}
              >
                <option value="">اختر القسم</option>
                {availableDepartments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الموظف المسؤول عن المهمة *</label>
              <select className={inputCls} value={form.assignedToId}
                onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))}>
                <option value="">اختر موظف</option>
                {availableEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} {emp.departmentName ? `(${emp.departmentName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">اخر معاد للتسليم</label>
              <input type="datetime-local" className={inputCls} value={form.dueDate}
                onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModel
          selectedTask={selectedTask}
          setTasks={setTasks}
          setSelectedTask={setSelectedTask}
          onClose={() => setSelectedTask(null)}
          onDelete={async () => {
            if (window.confirm("هل أنت متأكد من حذف هذه المهمة؟")) {
              await removeTask(selectedTask.id);
              setSelectedTask(null);
            }
          }}
        />
      )}
    </MainLayout>
  );
}

export default EmployeeTasksPage;
