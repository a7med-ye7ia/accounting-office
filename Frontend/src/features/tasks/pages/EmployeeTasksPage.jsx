import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Trash2,
  Lock,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import MainLayout from "../../../shared/layout/MainLayout";
import { Avatar, CardSkeleton } from "../../../shared/components/HrShared";
import TaskDetailsModel from "./TaskDetailsModel";
import SubtaskFormModal, {
  DateTimeConfirmField,
} from "../components/SubtaskFormModal";
import { Modal } from "../../../shared/components/HrShared";
import { toDateTimeLocal } from "../../../utils/dateFormat";
import { fetchUsers } from "../../../api/users";
import { fetchBranches } from "../../../api/branches";
import { fetchDepartments } from "../../../api/departments";
import {
  isOwner,
  isBranchManager,
  isDepartmentManager,
  isEmployee,
} from "../../../utils/roles";
import DeleteConfirmModal from "./DeleteConfirmModal";
import {
  fetchTasks,
  addTask,
  deleteTask,
  updateTask,
  claimTask,
} from "../../../api/tasks";
import { getApiErrorMessage } from "../../../utils/apiError";

// ─── Status Mapping ────────────────────────────────────────────────────────
const STATUS_TO_ARABIC = {
  PENDING: "قائمة الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "مكتمل",
};

const ARABIC_TO_STATUS = {
  "قائمة الانتظار": "PENDING",
  "قيد التنفيذ": "IN_PROGRESS",
  مكتمل: "DONE",
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
  const label =
    days < 0
      ? `${Math.abs(days)}d overdue`
      : days === 0
        ? "Due today"
        : `${days}d left`;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${cls}`}
    >
      {days <= 2 && <AlertTriangle size={9} />}
      {label}
    </span>
  );
}

const STAGE_META = {
  PENDING: {
    Icon: Circle,
    color: "text-appSubtext",
    bg: "bg-badgeGrayBg",
    ring: "ring-appBorder",
  },
  IN_PROGRESS: {
    Icon: Loader2,
    color: "text-badgeBlueText",
    bg: "bg-badgeBlueBg",
    ring: "ring-brand/30",
  },
  DONE: {
    Icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/15",
    ring: "ring-success/40",
  },
};

// ─── Task Card ──────────────────────────────────────────────────────────────
function TaskCard({ task, onMove, onOpen, onEdit, onClaim, canManage }) {
  const totalSubtasks = task.subtasks?.length || 0;
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const doneSubtasks = (task.subtasks || []).filter(
    (s) => s.status === "DONE",
  ).length;

  return (
    <div
      onClick={() => onOpen(task)}
      className="bg-appSurface rounded-2xl border border-appBorder shadow-panel p-4 hover:border-brand/20 hover:-translate-y-0.5 ui-transition cursor-grab active:cursor-grabbing group relative"
    >
      {/* Title */}
      <p className="text-sm font-semibold text-appText mb-2.5 leading-snug pr-2">
        {task.title}
      </p>

      {canManage && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onEdit(task);
    }}
    className="absolute top-3 end-12 w-8 h-8 rounded-lg flex items-center justify-center text-appSubtext hover:text-brand hover:bg-appMuted ui-transition"
    title="تعديل المهمة"
  >
    <Pencil size={14} />
  </button>
)}
{canManage && (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setConfirmDeleteOpen(true);
    }}
    className="absolute top-3 end-3 w-8 h-8 rounded-lg flex items-center justify-center text-appSubtext hover:text-red-500 hover:bg-appMuted ui-transition"
    title="حذف المهمة"
  >
    <Trash2 size={14} />
  </button>
)}

<DeleteConfirmModal
  open={confirmDeleteOpen}
  onCancel={() => setConfirmDeleteOpen(false)}
  onConfirm={() => {
    setConfirmDeleteOpen(false);
    onDelete(task);
  }}
/>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        {task.dueDate && <DeadlinePill dueDate={task.dueDate} />}
        {totalSubtasks > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-badgeBlueBg text-badgeBlueText border border-appBorder">
            {doneSubtasks}/{totalSubtasks} subtasks done
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3 mb-2">
        {totalSubtasks > 0 ? (
          // Tasks with subtasks have their status auto-derived from subtask
          // progress on the backend (syncParentStatus) — an employee can't
          // move the parent status directly here. Show it read-only; the
          // actual start/complete actions live per-subtask in the details
          // modal.
          <span
            className={`text-[11px] px-2 py-1 rounded-lg font-medium border border-appBorder ${
              task.status === "DONE"
                ? task.reviewed
                  ? "bg-success/15 text-success"
                  : "bg-badgePurpleBg text-badgePurpleText"
                : task.status === "IN_PROGRESS"
                  ? "bg-badgeBlueBg text-badgeBlueText"
                  : "bg-badgeGrayBg text-badgeGrayText"
            }`}
          >
            {task.status === "DONE"
              ? task.reviewed
                ? "تمت المراجعة"
                : "بانتظار المراجعة"
              : STATUS_TO_ARABIC[task.status]}
          </span>
        ) : (
          <>
            {!canManage && task.free && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim(task.id);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-brand text-white rounded-lg border border-brand hover:bg-brandDeep ui-transition"
              >
                استلام المهمة
              </button>
            )}

            {task.status === "PENDING" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(task.id, "IN_PROGRESS");
                }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] bg-badgeBlueBg text-badgeBlueText rounded-lg border border-appBorder hover:bg-badgeBlueBg/80 ui-transition"
              >
                بدءالعمل
              </button>
            )}

            {task.status === "IN_PROGRESS" && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(task.id, "PENDING");
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] bg-appMuted text-appSubtext rounded-lg border border-appBorder hover:bg-appBorder/40 ui-transition"
                >
                  وضع في قائمة الانتظار
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(task.id, "DONE");
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] bg-success/15 text-success rounded-lg border border-appBorder hover:bg-success/25 ui-transition"
                >
                  <CheckCircle2 size={11} />
                  تم الانتهاء
                </button>
              </>
            )}

            {task.status === "DONE" && (
              <span
                className={`text-[11px] px-2 py-1 rounded-lg font-medium border border-appBorder ${
                  task.reviewed
                    ? "bg-success/15 text-success"
                    : "bg-badgePurpleBg text-badgePurpleText"
                }`}
              >
                {task.reviewed ? "تمت المراجعة" : "بانتظار المراجعة"}
              </span>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 pt-3 border-t border-appBorder">
        <Avatar
          initials={task.assignedToName?.slice(0, 2).toUpperCase() || "?"}
          size="sm"
        />
        <p className="text-[11px] text-appSubtext truncate flex-1">
          {task.assignedToName || "Unassigned"}
        </p>
      </div>
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────
function KanbanColumn({
  status,
  tasks,
  onMove,
  onEdit,
  onClaim,
  canManage,
  loading,
  setSelectedTask,
}) {
  const { Icon, color, bg, ring } = STAGE_META[status];
  const arabicLabel = STATUS_TO_ARABIC[status];
  return (
    <div className="flex flex-col gap-4 bg-appMuted/60 rounded-2xl border border-appBorder p-4 min-w-[250px] flex-1 shadow-inner">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1 pb-1">
        <Icon size={14} className={color} />
        <span className="text-[11px] font-bold text-appSubtext uppercase tracking-[0.14em] flex-1">
          {arabicLabel}
        </span>
        <span
          className={`w-5 h-5 rounded-full ring-2 ${ring} ${bg} flex items-center justify-center text-[10px] font-bold text-appText`}
        >
          {tasks.length}
        </span>
      </div>

      {loading ? (
        <CardSkeleton count={2} />
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center text-appSubtext">
          <div className="w-10 h-10 bg-appBorder/50 rounded-xl flex items-center justify-center mb-2 border border-appBorder">
            <ClipboardList size={16} className="text-appSubtext" />
          </div>
          <p className="text-xs">No tasks here</p>
        </div>
      ) : (
        tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onMove={onMove}
            onEdit={onEdit}
            onClaim={onClaim}
            canManage={canManage}
            onOpen={setSelectedTask}
          />
        ))
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
const EMPTY_TASK = {
  title: "",
  description: "",
  branchId: "",
  departmentId: "",
  assignedToId: "",
  dueDate: "",
  status: "PENDING",
};

const MANAGER_ROLES = ["owner", "manager", "headbranch", "headdepartment"];

const getCurrentUser = () => JSON.parse(localStorage.getItem("user") || "null");

const isManagerUser = (user) =>
  MANAGER_ROLES.includes(String(user?.roleName || "").toLowerCase());

const normalizeSubtaskForForm = (subtask) => ({
  id: subtask.id,
  title: subtask.title || "",
  description: subtask.description || "",
  assignedToId: subtask.assignedToId ? String(subtask.assignedToId) : "",
  employeeName: subtask.assignedToName || subtask.employeeName || "",
  dueDate: toDateTimeLocal(subtask.dueDate),
  status: subtask.status,
});

const taskToForm = (task) => ({
  title: task.title || "",
  description: task.description || "",
  branchId: task.branchId ? String(task.branchId) : "",
  departmentId: task.departmentId ? String(task.departmentId) : "",
  assignedToId: task.assignedToId ? String(task.assignedToId) : "",
  dueDate: toDateTimeLocal(task.dueDate),
  status: task.status || "PENDING",
});

const taskWorkerIds = (task) =>
  (task.workingEmployees || []).map((worker) => String(worker.id));

const isTaskVisibleToUser = (
  task,
  currentUser,
  empRankMap,
  empIdMap,
  myRank,
) => {
  if (!currentUser) return false;
  const currentUserId = String(currentUser.id);
  const actualAssignedToId = task.assignedToId || empIdMap[task.assignedToName];
  if (String(actualAssignedToId || "") === currentUserId) return true;
  if (taskWorkerIds(task).includes(currentUserId)) return true;
  if (task.free) return true;
  const assigneeRank = empRankMap[actualAssignedToId] || 1;
  return assigneeRank < myRank;
};

const parseLocalDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const latestSubtaskDueDate = (items) =>
  items.reduce((latest, subtask) => {
    const dueDate = parseLocalDateTime(subtask.dueDate);
    if (!dueDate) return latest;
    return !latest || dueDate > latest ? dueDate : latest;
  }, null);

const formatDateTimeLocal = (date) => {
  if (!date) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

function EmployeeTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_TASK);
  const [editingTask, setEditingTask] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [pageError, setPageError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState(null);
  const [visibleSubtaskIndex, setVisibleSubtaskIndex] = useState(0);
  const [subtasks, setSubtasks] = useState([]);
  const [dueDateAutoMsg, setDueDateAutoMsg] = useState("");
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [isBranchLocked, setIsBranchLocked] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      try {
        const [allTasks, employeesData] = await Promise.all([
          fetchTasks(),
          fetchUsers(),
        ]);

        const currentUserStr = localStorage.getItem("user");
        const currentUser = JSON.parse(currentUserStr);
        console.log("currentUser ", currentUser);

        const roleRank = { owner: 4, headbranch: 3, manager: 2, employee: 1 };
        const myRoleKey = currentUser.roleName
          ? currentUser.roleName.toLowerCase()
          : "employee";
        const myRank = roleRank[myRoleKey] || 1;

        const empRankMap = {};
        const empIdMap = {};
        employeesData.forEach((emp) => {
          const empRoleKey = emp.roleName
            ? emp.roleName.toLowerCase()
            : "employee";
          empRankMap[emp.id] = roleRank[empRoleKey];
          empIdMap[emp.fullName] = emp.id;
        });

        console.log("All tasks from API:", allTasks);

        const filteredTasks = allTasks.filter((task) =>
          isTaskVisibleToUser(task, currentUser, empRankMap, empIdMap, myRank),
        );

        console.log("Filtered tasks:", filteredTasks);

        setTasks(filteredTasks);
        setEmployees(employeesData);
        // console.log("debug loaded tasks ", filteredTasks);
        // console.log("debug loaded employees ", employeesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const minDate = latestSubtaskDueDate(subtasks);
    if (!minDate) {
      setDueDateAutoMsg("");
      return;
    }
    const currentDueDate = parseLocalDateTime(form.dueDate);
    if (!currentDueDate || currentDueDate < minDate) {
      setForm((prev) => ({ ...prev, dueDate: formatDateTimeLocal(minDate) }));
      setDueDateAutoMsg(
        "تم تحديث موعد تسليم المهمة تلقائياً ليطابق أحدث موعد تسليم لمهمة فرعية.",
      );
    } else {
      setDueDateAutoMsg("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtasks]);

  const location = useLocation();
  useEffect(() => {
    const taskId = location.state?.openTaskId;

    if (!taskId || tasks.length === 0) return;

    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      setSelectedTask(task);
    }
  }, [tasks, location.state]);

  const moveTask = async (id, newStatus) => {
    const newTask = {
      status: newStatus,
    };
    try {
      const res = await updateTask(id, newTask);
      console.log("debug moveTask response ", res);
    } catch (error) {
      console.error("Error updating task status:", error);
      // ! optionally show a notification/error state here
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
  };

  const removeTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSelectedTask(null);
      setPageError("");
    } catch (error) {
      console.error("Error deleting task:", error);
      setPageError(getApiErrorMessage(error, "تعذر حذف المهمة."));
    }
  };

  const acceptTask = async (id) => {
    try {
      const updated = await updateTask(id, { status: "ACCEPTED" });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setSelectedTask(updated);
      setPageError("");
    } catch (error) {
      console.error("Error accepting task:", error);
      setPageError(getApiErrorMessage(error, "تعذر قبول المهمة."));
    }
  };

  const openCreateForm = async () => {
    setEditingTask(null);
    setForm(EMPTY_TASK);
    setSubtasks([]);
    setFormErrors({});
    setFormError("");
    setEditingSubtaskIndex(null);
    setVisibleSubtaskIndex(0);
    setDueDateAutoMsg("");
    setDepartments([]);
    setAvailableEmployees([]);
    setShowForm(true);

    const user = getCurrentUser();
    setLoadingBranches(true);
    try {
      const branchesData = await fetchBranches();
      setBranches(branchesData);

      let locked = false;
      let selectedBranchId = "";

      if (isOwner(user)) {
        locked = false;
      } else if (isBranchManager(user) || isEmployee(user)) {
        locked = true;
        if (branchesData.length > 0) {
          selectedBranchId = String(branchesData[0].id);
        }
      } else if (isDepartmentManager(user)) {
        if (branchesData.length <= 1) {
          locked = true;
          if (branchesData.length === 1) {
            selectedBranchId = String(branchesData[0].id);
          }
        } else {
          locked = false;
        }
      }

      setIsBranchLocked(locked);

      if (selectedBranchId) {
        setForm((p) => ({ ...p, branchId: selectedBranchId }));
        setLoadingDepartments(true);
        try {
          const deptsData = await fetchDepartments(selectedBranchId);
          setDepartments(deptsData);
          if (isEmployee(user) && deptsData.length === 1) {
            const selectedDeptId = String(deptsData[0].id);
            setForm((p) => ({
              ...p,
              branchId: selectedBranchId,
              departmentId: selectedDeptId,
            }));
            setLoadingEmployees(true);
            try {
              const usersData = await fetchUsers({
                branchId: selectedBranchId,
                departmentId: selectedDeptId,
              });
              const filteredUsers = isOwner(user)
                ? usersData
                : usersData.filter((u) => !isOwner(u));
              setAvailableEmployees(filteredUsers);
            } finally {
              setLoadingEmployees(false);
            }
          }
        } finally {
          setLoadingDepartments(false);
        }
      }
    } catch (err) {
      console.error("Error loading branches for task form:", err);
      setFormError("تعذر تحميل قائمة الفروع.");
    } finally {
      setLoadingBranches(false);
    }
  };

  const handleBranchChange = async (newBranchId) => {
    setForm((prev) => ({
      ...prev,
      branchId: newBranchId,
      departmentId: "",
      assignedToId: "",
    }));
    setFormErrors((prev) => {
      const { branchId, departmentId, assignedToId, ...rest } = prev;
      return rest;
    });
    setDepartments([]);
    setAvailableEmployees([]);
    setSubtasks((prev) =>
      prev.map((s) => ({ ...s, assignedToId: "", employeeName: "" })),
    );

    if (!newBranchId) return;

    setLoadingDepartments(true);
    try {
      const deptsData = await fetchDepartments(newBranchId);
      setDepartments(deptsData);
    } catch (err) {
      console.error("Error loading departments:", err);
      setFormError("تعذر تحميل قائمة الأقسام.");
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleDepartmentChange = async (newDeptId) => {
    setForm((prev) => ({
      ...prev,
      departmentId: newDeptId,
      assignedToId: "",
    }));
    setFormErrors((prev) => {
      const { departmentId, assignedToId, ...rest } = prev;
      return rest;
    });
    setAvailableEmployees([]);
    setSubtasks((prev) =>
      prev.map((s) => ({ ...s, assignedToId: "", employeeName: "" })),
    );

    if (!newDeptId) return;

    setLoadingEmployees(true);
    try {
      const usersData = await fetchUsers({
        branchId: form.branchId,
        departmentId: newDeptId,
      });
      const user = getCurrentUser();
      const filteredUsers = isOwner(user)
        ? usersData
        : usersData.filter((u) => !isOwner(u));
      setAvailableEmployees(filteredUsers);
    } catch (err) {
      console.error("Error loading employees for department:", err);
      setFormError("تعذر تحميل قائمة الموظفين.");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const openEditForm = async (task) => {
    setEditingTask(task);
    setForm(taskToForm(task));
    setSubtasks((task.subtasks || []).map(normalizeSubtaskForForm));
    setFormErrors({});
    setFormError("");
    setEditingSubtaskIndex(null);
    setVisibleSubtaskIndex(0);
    setSelectedTask(null);
    setDueDateAutoMsg("");
    setDepartments([]);
    setAvailableEmployees([]);
    setShowForm(true);

    const user = getCurrentUser();
    setLoadingBranches(true);
    try {
      const branchesData = await fetchBranches();
      setBranches(branchesData);

      let locked = false;
      if (isOwner(user)) {
        locked = false;
      } else if (isBranchManager(user) || isEmployee(user)) {
        locked = true;
      } else if (isDepartmentManager(user)) {
        locked = branchesData.length <= 1;
      }
      setIsBranchLocked(locked);

      const targetBranchId = task.branchId
        ? String(task.branchId)
        : locked && branchesData.length > 0
          ? String(branchesData[0].id)
          : "";

      if (targetBranchId) {
        setLoadingDepartments(true);
        try {
          const deptsData = await fetchDepartments(targetBranchId);
          setDepartments(deptsData);

          const targetDeptId = task.departmentId ? String(task.departmentId) : "";
          if (targetDeptId) {
            setLoadingEmployees(true);
            try {
              const usersData = await fetchUsers({
                branchId: targetBranchId,
                departmentId: targetDeptId,
              });
              const filteredUsers = isOwner(user)
                ? usersData
                : usersData.filter((u) => !isOwner(u));
              setAvailableEmployees(filteredUsers);
            } finally {
              setLoadingEmployees(false);
            }
          }
        } finally {
          setLoadingDepartments(false);
        }
      }
    } catch (err) {
      console.error("Error initializing edit task form:", err);
      setFormError("تعذر تحميل بيانات المهمة للتعديل.");
    } finally {
      setLoadingBranches(false);
    }
  };

  const closeTaskForm = () => {
    if (saveSubmitting) return;
    setShowForm(false);
    setEditingTask(null);
    setFormErrors({});
    setFormError("");
    setEditingSubtaskIndex(null);
    setVisibleSubtaskIndex(0);
    setDueDateAutoMsg("");
    setDepartments([]);
    setAvailableEmployees([]);
  };

  const validateTaskForm = () => {
    const next = {};
    if (!form.title.trim()) next.title = "العنوان مطلوب";
    if (!form.branchId) next.branchId = "الفرع مطلوب";
    if (!form.departmentId) next.departmentId = "القسم مطلوب";
    if (!form.assignedToId) next.assignedToId = "الموظف مطلوب";
    if (subtasks.length === 0 && !form.dueDate) {
      next.dueDate = "موعد التسليم مطلوب";
    }
    if (subtasks.length > 0 && !latestSubtaskDueDate(subtasks)) {
      next.dueDate = "موعد تسليم كل مهمة فرعية مطلوب";
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleParentDueDateChange = (value) => {
    const minDate = latestSubtaskDueDate(subtasks);
    const selected = parseLocalDateTime(value);
    if (minDate && selected && selected < minDate) {
      setFormErrors((prev) => ({
        ...prev,
        dueDate:
          "لا يمكن أن يكون موعد تسليم المهمة قبل موعد تسليم أحدث مهمة فرعية",
      }));
      return; // reject — dueDate stays at the current (min) value
    }
    setFormErrors((prev) => {
      const { dueDate, ...rest } = prev;
      return rest;
    });
    setForm((p) => ({ ...p, dueDate: value }));
  };

  const buildTaskPayload = () => {
    const latestDueDate = latestSubtaskDueDate(subtasks);
    const parentDueDate =
      form.dueDate ||
      (latestDueDate ? formatDateTimeLocal(latestDueDate) : null);
    return {
      title: form.title.trim(),
      description: form.description,
      branchId: form.branchId ? parseInt(form.branchId, 10) : null,
      departmentId: form.departmentId ? parseInt(form.departmentId, 10) : null,
      status: form.status,
      dueDate: parentDueDate,
      assignedToId: parseInt(form.assignedToId, 10),
      createdById:
        editingTask?.createdById ||
        (localStorage.getItem("user")
          ? JSON.parse(localStorage.getItem("user")).id
          : 1),
      subtasks: subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description,
        dueDate: subtask.dueDate,
        assignedToId: parseInt(subtask.assignedToId || form.assignedToId, 10),
      })),
    };
  };

  const handleSave = async () => {
    setFormError("");
    if (!validateTaskForm()) return;

    setSaveSubmitting(true);

    const taskPayload = buildTaskPayload();

    try {
      const savedTask = editingTask
        ? await updateTask(editingTask.id, taskPayload)
        : await addTask(taskPayload);
      setTasks((prev) =>
        editingTask
          ? prev.map((t) => (t.id === savedTask.id ? savedTask : t))
          : [...prev, savedTask],
      );
      setShowForm(false);
      setEditingTask(null);
      setSubtasks([]);
      setVisibleSubtaskIndex(0);
      setDepartments([]);
      setAvailableEmployees([]);
    } catch (error) {
      console.error("Error saving task:", error);
      setFormError(getApiErrorMessage(error, "تعذر حفظ المهمة."));
    } finally {
      setSaveSubmitting(false);
    }
  };

  const handleAddSubtask = (subtaskData) => {
    const pool = availableEmployees.length > 0 ? availableEmployees : employees;
    const assignedEmployee = pool.find(
      (emp) => emp.id === subtaskData.assignedToId,
    );

    const nextSubtask = {
      ...subtaskData,
      assignedToId: String(subtaskData.assignedToId),
      employeeName: assignedEmployee?.fullName || "",
    };

    if (editingSubtaskIndex === null) {
      setSubtasks((prev) => [...prev, nextSubtask]);
      setVisibleSubtaskIndex(subtasks.length);
      if (!form.assignedToId && subtasks.length === 0) {
        setForm((prev) => ({
          ...prev,
          assignedToId: String(subtaskData.assignedToId),
        }));
      }
    } else {
      setSubtasks((prev) =>
        prev.map((item, index) =>
          index === editingSubtaskIndex ? { ...item, ...nextSubtask } : item,
        ),
      );
    }

    setShowSubtaskModal(false);
    setEditingSubtaskIndex(null);
  };

  const handleParentAssigneeChange = (value) => {
    const pool = availableEmployees.length > 0 ? availableEmployees : employees;
    const assignedEmployee = pool.find(
      (emp) => String(emp.id) === String(value),
    );
    setForm((prev) => ({ ...prev, assignedToId: value }));
    setFormErrors((prev) => {
      const { assignedToId, ...rest } = prev;
      return rest;
    });
    if (!value) return;
    setSubtasks((prev) =>
      prev.map((subtask) => ({
        ...subtask,
        assignedToId: String(value),
        employeeName: assignedEmployee?.fullName || subtask.employeeName,
      })),
    );
  };

  const handleClaimTask = async (taskId) => {
    try {
      const updated = await claimTask(taskId);
      setTasks((prev) =>
        prev.map((task) => (task.id === updated.id ? updated : task)),
      );
      setPageError("");
    } catch (error) {
      console.error("Error claiming task:", error);
      setPageError(getApiErrorMessage(error, "تعذر استلام المهمة."));
    }
  };

  const KANBAN_STAGES = ["PENDING", "IN_PROGRESS", /*'REVIEW',*/ "DONE"];
  const tasksByStatus = (status) => tasks.filter((t) => t.status === status);
  const activeSubtaskIndex =
    subtasks.length === 0
      ? 0
      : Math.min(visibleSubtaskIndex, subtasks.length - 1);
  const activeSubtask = subtasks[activeSubtaskIndex];

  const totalDone = tasks.filter((t) => t.status === "DONE").length;
  const overdue = tasks.filter(
    (t) => daysRemaining(t.dueDate) < 0 && t.status !== "DONE",
  ).length;
  const inputCls =
    "w-full px-3 py-2.5 bg-appMuted border border-appBorder rounded-xl text-sm text-appText placeholder:text-appSubtext/80 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand ui-transition";
  const currentUser = getCurrentUser();
  const canManageTasks = isManagerUser(currentUser);

  const actions = (
    <button
      onClick={openCreateForm}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl shadow-panel hover:bg-brandDeep active:scale-[0.98] ui-transition"
    >
      <Plus size={15} /> اضافة مهمة جديدة
    </button>
  );

  return (
    <MainLayout
      title="مهامي"
      subtitle=""
      actions={!canManageTasks ? null : actions}
    >
      <div className="space-y-5">
        {pageError && (
          <p className="text-sm text-danger bg-badgeRedBg border border-appBorder rounded-xl px-3 py-2">
            {pageError}
          </p>
        )}
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "العدد الكلي للمهمات",
              value: tasks.length,
              Icon: ClipboardList,
              colorClass: "bg-badgeBlueBg text-badgeBlueText",
            },
            {
              label: "عدد المهمات المكتملة",
              value: totalDone,
              Icon: CheckCircle2,
              colorClass: "bg-success/15 text-success",
            },
            {
              label: "عدد المهمات المتأخرة",
              value: overdue,
              Icon: AlertTriangle,
              colorClass: "bg-badgeRedBg text-badgeRedText",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-appSurface rounded-2xl border border-appBorder p-4 flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.colorClass}`}
              >
                <s.Icon size={16} />
              </div>
              <div>
                <p className="text-xl font-extrabold font-display text-appText">
                  {loading ? "—" : s.value}
                </p>
                <p className="text-[11px] text-appSubtext">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div
          className="flex gap-4 overflow-x-auto pb-4"
          style={{ minHeight: "60vh" }}
        >
          {KANBAN_STAGES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasksByStatus(status)}
              onMove={moveTask}
              onEdit={openEditForm}
              onClaim={handleClaimTask}
              canManage={canManageTasks}
              loading={loading}
              setSelectedTask={setSelectedTask}
            />
          ))}
        </div>
      </div>

      {/* New Task Modal */}
      {showForm && (
        <Modal
          title={editingTask ? "تعديل المهمة" : "اضافة مهمة جديدة"}
          onClose={closeTaskForm}
          bodyScroll={true}
          footer={
            <>
              <button
                onClick={closeTaskForm}
                disabled={saveSubmitting}
                className="px-4 py-2 text-sm font-medium text-appText bg-appMuted border border-appBorder rounded-xl hover:bg-appBorder/30 ui-transition"
              >
                الغاء
              </button>
              <button
                onClick={handleSave}
                disabled={
                  saveSubmitting ||
                  loadingBranches ||
                  loadingDepartments ||
                  loadingEmployees ||
                  !form.title.trim() ||
                  !form.branchId ||
                  !form.departmentId ||
                  !form.assignedToId
                }
                className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep ui-transition shadow-panel disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveSubmitting
                  ? "جاري الحفظ..."
                  : editingTask
                    ? "حفظ التعديلات"
                    : "اضافة"}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            {formError && (
              <p className="text-sm text-danger bg-badgeRedBg border border-appBorder rounded-xl px-3 py-2">
                {formError}
              </p>
            )}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                عنوان المهمة *
              </label>

              <input
                className={inputCls}
                placeholder="اكتب عنوان للمهمة..."
                value={form.title}
                onChange={(e) => {
                  setForm((p) => ({ ...p, title: e.target.value }));
                  setFormErrors((prev) => {
                    const { title, ...rest } = prev;
                    return rest;
                  });
                }}
              />
              {formErrors.title && (
                <p className="text-xs text-danger mt-1">{formErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                وصف المهمة
              </label>

              <textarea
                className={inputCls}
                placeholder="اكتب وصف المهمة..."
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={3}
              />
            </div>

            {/* 3. Branch */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext">
                  الفرع *
                </label>
                {isBranchLocked && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-appSubtext font-medium">
                    <Lock size={12} className="text-appSubtext" />
                    محدد حسب صلاحيتك
                  </span>
                )}
              </div>
              <select
                className={`${inputCls} ${isBranchLocked ? "opacity-75 cursor-not-allowed bg-appMuted/80" : ""}`}
                value={form.branchId}
                disabled={isBranchLocked || loadingBranches}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                {loadingBranches ? (
                  <option value="">جاري تحميل الفروع...</option>
                ) : (
                  <>
                    {!isBranchLocked && <option value="">اختر الفرع</option>}
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {formErrors.branchId && (
                <p className="text-xs text-danger mt-1">{formErrors.branchId}</p>
              )}
            </div>

            {/* 4. Department */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                القسم *
              </label>
              <select
                className={`${inputCls} ${!form.branchId || loadingDepartments ? "opacity-75 cursor-not-allowed bg-appMuted/80" : ""}`}
                value={form.departmentId}
                disabled={!form.branchId || loadingDepartments}
                onChange={(e) => handleDepartmentChange(e.target.value)}
              >
                {!form.branchId ? (
                  <option value="">[ اختر الفرع أولاً ]</option>
                ) : loadingDepartments ? (
                  <option value="">جاري تحميل الأقسام...</option>
                ) : departments.length === 0 ? (
                  <option value="">[ لا توجد أقسام متاحة لهذا الفرع ]</option>
                ) : (
                  <>
                    <option value="">اختر القسم</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {formErrors.departmentId && (
                <p className="text-xs text-danger mt-1">{formErrors.departmentId}</p>
              )}
            </div>

            {/* 5. Assigned Employee */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                الموظف المسؤول عن المهمة *
              </label>
              <select
                className={`${inputCls} ${!form.departmentId || loadingEmployees ? "opacity-75 cursor-not-allowed bg-appMuted/80" : ""}`}
                value={form.assignedToId}
                disabled={!form.departmentId || loadingEmployees}
                onChange={(e) => handleParentAssigneeChange(e.target.value)}
              >
                {!form.branchId ? (
                  <option value="">[ اختر الفرع أولاً ]</option>
                ) : !form.departmentId ? (
                  <option value="">[ اختر القسم أولاً ]</option>
                ) : loadingEmployees ? (
                  <option value="">جاري تحميل الموظفين...</option>
                ) : availableEmployees.length === 0 ? (
                  <option value="" disabled>
                    [ لا يوجد موظفون متاحون لهذا الفرع والقسم ]
                  </option>
                ) : (
                  <>
                    <option value="">اختر موظف</option>
                    {availableEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {formErrors.assignedToId && (
                <p className="text-xs text-danger mt-1">
                  {formErrors.assignedToId}
                </p>
              )}
            </div>

            {/* 6. Subtasks */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                المهام الفرعية
              </label>

              <button
                type="button"
                disabled={!form.departmentId}
                onClick={() => {
                  setEditingSubtaskIndex(null);
                  setShowSubtaskModal(true);
                }}
                className="w-full border-2 border-dashed border-appBorder rounded-xl px-4 py-3 text-sm font-medium text-appSubtext hover:text-appText hover:border-brand hover:bg-appMuted/50 ui-transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + إضافة مهمة فرعية {!form.departmentId ? "(يرجى اختيار الفرع والقسم أولاً)" : ""}
              </button>

              {subtasks.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-appSubtext">
                      {activeSubtaskIndex + 1} / {subtasks.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={activeSubtaskIndex === 0}
                        onClick={() =>
                          setVisibleSubtaskIndex((index) =>
                            Math.max(index - 1, 0),
                          )
                        }
                        className="px-3 py-1 text-xs bg-appMuted text-appText border border-appBorder rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-appBorder/30 ui-transition"
                      >
                        السابق
                      </button>
                      <button
                        type="button"
                        disabled={activeSubtaskIndex >= subtasks.length - 1}
                        onClick={() =>
                          setVisibleSubtaskIndex((index) =>
                            Math.min(index + 1, subtasks.length - 1),
                          )
                        }
                        className="px-3 py-1 text-xs bg-appMuted text-appText border border-appBorder rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-appBorder/30 ui-transition"
                      >
                        التالي
                      </button>
                    </div>
                  </div>

                  {activeSubtask && (
                    <div className="h-28 overflow-y-auto border border-appBorder rounded-xl p-3 bg-appMuted/40">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-appText">
                            {activeSubtask.title}
                          </p>

                          {activeSubtask.description && (
                            <p className="text-xs text-appSubtext mt-1">
                              {activeSubtask.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-appSubtext">
                            <span>الموظف: {activeSubtask.employeeName}</span>
                            <span>التسليم: {activeSubtask.dueDate}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubtaskIndex(activeSubtaskIndex);
                              setShowSubtaskModal(true);
                            }}
                            className="text-xs text-brand hover:underline"
                          >
                            تعديل
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSubtasks((prev) =>
                                prev.filter((_, i) => i !== activeSubtaskIndex),
                              );
                              setVisibleSubtaskIndex((index) =>
                                Math.max(
                                  Math.min(index, subtasks.length - 2),
                                  0,
                                ),
                              );
                            }}
                            className="text-xs text-danger hover:underline"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-1.5">
                اخر معاد للتسليم{subtasks.length === 0 ? "" : " (اختياري)"}
              </label>

              <DateTimeConfirmField
                value={form.dueDate}
                onChange={handleParentDueDateChange}
                inputClassName={inputCls}
              />
              {formErrors.dueDate && (
                <p className="text-xs text-danger mt-1">{formErrors.dueDate}</p>
              )}
              {!formErrors.dueDate && dueDateAutoMsg && (
                <p className="text-xs text-badgeBlueText mt-1">
                  {dueDateAutoMsg}
                </p>
              )}
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
          onDelete={() => removeTask(selectedTask.id)}
          onEdit={() => openEditForm(selectedTask)}
          onAccept={() => acceptTask(selectedTask.id)}
          onClose={() => setSelectedTask(null)}
        />
      )}
      {showSubtaskModal && (
        <SubtaskFormModal
          title={
            editingSubtaskIndex === null
              ? "إضافة مهمة فرعية"
              : "تعديل مهمة فرعية"
          }
          employees={availableEmployees.length > 0 ? availableEmployees : employees}
          defaultAssignedToId={form.assignedToId}
          initial={
            editingSubtaskIndex === null ? null : subtasks[editingSubtaskIndex]
          }
          confirmLabel={
            editingSubtaskIndex === null ? "إضافة" : "حفظ التعديلات"
          }
          onClose={() => {
            setShowSubtaskModal(false);
            setEditingSubtaskIndex(null);
          }}
          onSubmit={handleAddSubtask}
        />
      )}
    </MainLayout>
  );
}

export default EmployeeTasksPage;