import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Plus, AlertTriangle,
  CheckCircle2, Circle, Loader2
} from 'lucide-react';
import MainLayout from '../../../shared/layout/MainLayout';
import { Avatar, PriorityBadge, CardSkeleton, Modal } from '../../../shared/components/HrShared';
import { KANBAN_STAGES } from '../../../shared/data/hrMockData';
import { fetchUsers } from '../../../api/users';
import {getTaskByAssignedToId, addTask, deleteTask, updateTask } from '../../../api/tasks';
import { addCommentToTask } from '../../../api/comments';

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
      <p className="text-sm font-semibold text-appText mb-2.5 leading-snug pr-2">{task.title}</p>

      {/*task.description && (
        <div className="mb-2">
          <button
            onClick={() => setShowDesc(v => !v)}
            className="text-[11px] text-brand hover:underline ui-transition"
          >
            {showDesc ? 'إخفاء الوصف' : 'عرض الوصف'}
          </button>

          {showDesc && (
            <p className="text-xs text-appSubtext mt-1 leading-relaxed bg-appMuted p-2 rounded-lg">
              {task.description}
            </p>
          )}
        </div>
      ) */}

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
            {/* <ArrowRight size={11} /> */}
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
          <span className={`text-[11px] px-2 py-1 rounded-lg font-medium border border-appBorder ${
            task.reviewed ? "bg-success/15 text-success" : "bg-badgePurpleBg text-badgePurpleText"
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
  title: '', assignedToId: '', dueDate: '', status: 'PENDING', description: ''
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [saveSubmitting, setSaveSubmitting] = useState(false);

  useEffect(() => {

    const loadData = async () => {
      try {
        const [tasksData, employeesData] = await Promise.all([getTaskByAssignedToId(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 1), fetchUsers()]);
        setTasks(tasksData);
        setEmployees(employeesData);
        console.log("debug loaded tasks ", tasksData);
        console.log("debug loaded employees ", employeesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const moveTask = async (id, newStatus) => {
    const newTask = {
      status: newStatus
    };
    try {
      const res = await updateTask(id, newTask);
      console.log("debug moveTask response ", res);
    } catch (error) {
      console.error('Error updating task status:', error);
      // ! optionally show a notification/error state here
      return;
    }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  }

  const removeTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
      // ! optionally show a notification/error state here
    }
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.assignedToId) return;

    // console.log(form);
    
    setSaveSubmitting(true);

    const newTask = {
      title: form.title,
      description: form.description,
      status: form.status,
      dueDate: form.dueDate || null,
      assignedToId: parseInt(form.assignedToId),
      createdById: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 1, // ! hardcoded fallback
    };

    try {
      const savedTask = await addTask(newTask);
      setTasks(prev => [...prev, savedTask]);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving task:', error);
      // ! optionally show a notification/error state here
    } finally {
      setSaveSubmitting(false);
    }
  };

  const KANBAN_STAGES = ['PENDING', 'IN_PROGRESS', /*'REVIEW',*/ 'DONE'];
  const tasksByStatus = status => tasks.filter(t => t.status === status);

  const totalDone = tasks.filter(t => t.status === 'DONE').length;
  const overdue = tasks.filter(t => daysRemaining(t.dueDate) < 0 && t.status !== 'DONE').length;

  const inputCls = 'w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-appSubtext/80 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ui-transition';

  const actions = (
    <button
      onClick={() => { setForm(EMPTY_TASK); setShowForm(true); }}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-panel hover:bg-brandDeep active:scale-[0.98] ui-transition"
    >
      <Plus size={15} /> اضافة مهمة جديدة
    </button>
  );

  return (
    <MainLayout title="مهام الموظفين" subtitle="" actions={JSON.parse(localStorage.getItem('user')).roleName === "employee" ? null : actions}>
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
            {/* <div className="grid grid-cols-2 gap-3"> */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">الموظف المسؤل عن المهمة</label>
              <select className={inputCls} value={form.assignedToId}
                onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))}>
                <option value="">اختر موظف</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
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
        <Modal
          title="تفاصيل المهمة"
          onClose={() => setSelectedTask(null)}
          footer={
            <button
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep ui-transition shadow-panel"
            >
              اغلاق
            </button>
          }
        >
          <div className="space-y-4">

            {/* Title */}
            <div>
              <p className="text-xs text-appSubtext">العنوان</p>
              <p className="text-sm font-semibold text-appText">
                {selectedTask.title}
              </p>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-appSubtext">الوصف</p>
              <p className="text-sm text-appText bg-appMuted p-2 rounded-lg">
                {selectedTask.description || 'لا يوجد وصف'}
              </p>
            </div>

            {/* Assigned */}
            <div>
              <p className="text-xs text-appSubtext">الموظف</p>
              <p className="text-sm text-appText">
                {selectedTask.assignedToName || 'غير محدد'}
              </p>
            </div>

            {/* Deadline */}
            <div>
              <p className="text-xs text-appSubtext">موعد التسليم</p>
              <p className="text-sm text-appText">
                {selectedTask.dueDate
                  ? new Date(selectedTask.dueDate).toLocaleString()
                  : 'غير محدد'}
              </p>
            </div>

            {/* Comments Section */}
            <div>
              <p className="text-xs text-appSubtext mb-2">التعليقات</p>

              {/* Comments list (temporary static) */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(selectedTask.comments || []).length === 0 ? (
                  <p className="text-xs text-appSubtext">لا توجد تعليقات</p>
                ) : (
                  selectedTask.comments.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 bg-appMuted p-2 rounded-lg"
                    >
                      {/* Avatar */}
                      <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-semibold">
                        {c.createdByName?.charAt(0) || "?"}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-appText">
                          {c.createdByName || "Unknown"}
                        </span>
                        <span className="text-xs text-appSubtext">
                          {c.message}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment */}
              <AddCommentBox task={selectedTask} setTasks={setTasks} />
            </div>

          </div>
        </Modal>
      )}
    </MainLayout>
  );
}

export default EmployeeTasksPage;
