import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Clock3,
  Loader2,
  CheckCircle2,
  Search,
  AlertTriangle,
} from "lucide-react";

import MainLayout from "../../../shared/layout/MainLayout";
import TaskDetailsModel from "./TaskDetailsModel";
import { getTaskByCreatedById, deleteTask, updateTask } from "../../../api/tasks";
import { isEmployee } from "../../../utils/roles";

const STATUS_AR = {
  PENDING: "في الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  DONE: "بانتظار المراجعة",
  ACCEPTED: "معتمدة",
};

const StatCard = ({ title, value, icon: IconComponent, color }) => (
  <div className="bg-appSurface border border-appBorder rounded-2xl p-4 flex items-center gap-3">
    <div
      className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}
    >
      {React.createElement(IconComponent, { size: 18 })}
    </div>

    <div>
      <p className="text-2xl font-bold text-appText">{value}</p>
      <p className="text-xs text-appSubtext">{title}</p>
    </div>
  </div>
);

export default function AssignedTasksDashboard() {
  const [selectedTask, setSelectedTask] = useState(null);

  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return;
    }

    const user = JSON.parse(userStr);
    if (isEmployee(user)) {
      navigate('/dashboard');
      return;
    }

    const loadTasks = async () => {
      try {
        const tasksData = await getTaskByCreatedById(user.id);
        setTasks(tasksData);
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
    };

    loadTasks();
  }, [navigate]);

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
      setSelectedTask(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await updateTask(taskId, { status: "ACCEPTED" });
      setTasks((prevTasks) => prevTasks.map((t) => (t.id === taskId ? { ...t, status: "ACCEPTED" } : t)));
      setSelectedTask((prev) => ({ ...prev, status: "ACCEPTED" }));
    } catch (error) {
      console.error("Error accepting task:", error);
    }
  };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        (task.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (task.assignedToName || '').toLowerCase().includes(search.toLowerCase()) ||
        (task.workingEmployees || []).some((worker) =>
          (worker.fullName || '').toLowerCase().includes(search.toLowerCase()),
        );

      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "PENDING").length,
    progress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    review: tasks.filter((t) => t.status === "DONE").length,
    approved: tasks.filter((t) => t.status === "ACCEPTED").length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-1 rounded-lg text-xs bg-appMuted text-appSubtext">
            في الانتظار
          </span>
        );

      case "IN_PROGRESS":
        return (
          <span className="px-2 py-1 rounded-lg text-xs bg-badgeBlueBg text-badgeBlueText">
            قيد التنفيذ
          </span>
        );

      case "DONE":
        return (
          <span className="px-2 py-1 rounded-lg text-xs bg-yellow-100 text-yellow-700">
            بانتظار المراجعة
          </span>
        );

      case "ACCEPTED":
        return (
          <span className="px-2 py-1 rounded-lg text-xs bg-success/15 text-success">
            معتمدة
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout
      title="متابعة المهام"
      subtitle="متابعة حالة المهام التي قمت بتعيينها"
    >
      <div dir="rtl" className="space-y-6">

        {/* المهام التي تحتاج مراجعة */}

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} />
            <h2 className="font-bold">
              المهام التي تنتظر مراجعتك
            </h2>
          </div>

          {tasks.filter((t) => t.status === "DONE").length === 0 ? (
            <p className="text-sm text-appSubtext">
              لا توجد مهام تحتاج مراجعة حالياً
            </p>
          ) : (
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status === "DONE")
                .map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white hover:bg-gray-50 border"
                  >
                    <span>{task.assignedToName || 'غير محدد'}</span>
                    <span className="font-medium">{task.title}</span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* الاحصائيات */}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">

          <StatCard
            title="إجمالي المهام"
            value={stats.total}
            icon={ClipboardList}
            color="bg-badgeBlueBg text-badgeBlueText"
          />

          <StatCard
            title="في الانتظار"
            value={stats.pending}
            icon={Clock3}
            color="bg-appMuted text-appSubtext"
          />

          <StatCard
            title="قيد التنفيذ"
            value={stats.progress}
            icon={Loader2}
            color="bg-badgeBlueBg text-badgeBlueText"
          />

          <StatCard
            title="بانتظار المراجعة"
            value={stats.review}
            icon={AlertTriangle}
            color="bg-yellow-100 text-yellow-700"
          />

          <StatCard
            title="معتمدة"
            value={stats.approved}
            icon={CheckCircle2}
            color="bg-success/15 text-success"
          />
        </div>

        {/* الفلاتر */}

        <div className="bg-appSurface border border-appBorder rounded-2xl p-4 flex flex-col lg:flex-row gap-3">

          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute right-3 top-3 text-appSubtext"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المهمة أو الموظف..."
              className="w-full pr-10 pl-3 py-2 rounded-xl border border-appBorder bg-appMuted"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-appBorder bg-appMuted"
          >
            <option value="ALL">كل الحالات</option>
            <option value="PENDING">في الانتظار</option>
            <option value="IN_PROGRESS">قيد التنفيذ</option>
            <option value="DONE">بانتظار المراجعة</option>
            <option value="ACCEPTED">معتمدة</option>
          </select>
        </div>

        {/* الجدول */}

        <div className="bg-appSurface border border-appBorder rounded-2xl overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full text-right">

              <thead className="bg-appMuted">
                <tr>
                  <th className="p-4">عنوان المهمة</th>
                  <th className="p-4">الموظف</th>
                  <th className="p-4">تاريخ الإنشاء</th>
                  <th className="p-4">موعد التسليم</th>
                  <th className="p-4">عدد التعليقات</th>
                  <th className="p-4">الحالة</th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="border-t border-appBorder hover:bg-appMuted/40 cursor-pointer transition"
                  >
                    <td className="p-4 font-semibold">
                      {task.title}
                    </td>

                    <td className="p-4">
                      {task.assignedToName || 'غير محدد'}
                    </td>

                    <td className="p-4">
                      {new Date(task.createdAt)
                        .toLocaleDateString("ar-EG")}
                    </td>

                    <td className="p-4">
                      {new Date(task.dueDate)
                        .toLocaleDateString("ar-EG")}
                    </td>

                    <td className="p-4">
                      {task.comments?.length || 0}
                    </td>

                    <td className="p-4">
                      {getStatusBadge(task.status)}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailsModel
          selectedTask={selectedTask}
          setTasks={setTasks}
          setSelectedTask={setSelectedTask}
          onDelete={() => handleDeleteTask(selectedTask.id)}
          onAccept={() => handleAcceptTask(selectedTask.id)}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </MainLayout>
  );
}
