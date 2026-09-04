import React, { useState } from 'react';
import { Modal } from '../../../shared/components/HrShared';
import { addCommentToTask } from '../../../api/comments';
import { startSubTask, completeSubTask, claimSubTask } from '../../../api/tasks';
import { getApiErrorMessage } from '../../../utils/apiError';

function AddCommentBox({ task, setTasks, setSelectedTask }) {
  const [text, setText] = useState('');

  const handleAdd = async () => {
    if (!text.trim()) return;

    const newComment = {
      message: text,
      createdById: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : 1,
      taskId: task.id,
    };

    try {
      await addCommentToTask(newComment);
    } catch (error) {
      console.error('Error adding comment:', error);
    }

    newComment.createdByName = JSON.parse(localStorage.getItem('user'))?.fullName || 'Unknown';

    setTasks(prev =>
      prev.map(t =>
        t.id === task.id
          ? { ...t, comments: [...(t.comments || []), newComment] }
          : t
      )
    );

    setSelectedTask(prev => ({
      ...prev,
      comments: [...(prev.comments || []), newComment]
    }));

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

const MANAGER_ROLES = ['owner', 'manager', 'headbranch', 'headdepartment'];
const SUBTASK_STATUS_LABELS = {
  PENDING: 'في الانتظار',
  IN_PROGRESS: 'قيد التنفيذ',
  DONE: 'مكتمل',
};

function TaskDetailsModel({ selectedTask, setTasks, onClose, onDelete, onEdit, onAccept, setSelectedTask }) {
  const [subtaskActionId, setSubtaskActionId] = useState(null);
  const [subtaskActionError, setSubtaskActionError] = useState('');

  if (!selectedTask) return null;
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  // console.log('Current user:', user);
  console.log('Selected task:', selectedTask);
  const canManage = user ? MANAGER_ROLES.includes(String(user.roleName || '').toLowerCase()) : false;
  const subtasks = selectedTask.subtasks || [];
  const currentUserId = user ? String(user.id) : '';
  const workingUserIds = (selectedTask.workingEmployees || []).map((worker) => String(worker.id));

  const handleSubtaskAction = async (subtask, action) => {
    setSubtaskActionError('');
    setSubtaskActionId(subtask.id);
    try {
      const updatedTask = action === 'start'
        ? await startSubTask(selectedTask.id, subtask.id)
        : await completeSubTask(selectedTask.id, subtask.id);
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      setSelectedTask(updatedTask);
    } catch (error) {
      console.error('Error updating subtask:', error);
      setSubtaskActionError(getApiErrorMessage(error, 'تعذر تنفيذ العملية.'));
    } finally {
      setSubtaskActionId(null);
    }
  };

  const handleClaimSubtask = async (subtask) => {
    setSubtaskActionError('');
    setSubtaskActionId(subtask.id);
    try {
      const updatedTask = await claimSubTask(selectedTask.id, subtask.id);
      setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
      setSelectedTask(updatedTask);
    } catch (error) {
      console.error('Error claiming subtask:', error);
      setSubtaskActionError(getApiErrorMessage(error, 'تعذر استلام المهمة الفرعية.'));
    } finally {
      setSubtaskActionId(null);
    }
  };


  return (
    <Modal
      title={selectedTask.title || 'تفاصيل المهمة'}
      onClose={onClose}
      footer={
        <>
          {canManage && (
            <>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-xl hover:bg-brandDeep ui-transition shadow-panel"
                >
                  تعديل المهمة
                </button>
              )}
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 ui-transition shadow-panel"
              >
                حذف المهمة
              </button>
              
              {selectedTask.status === 'DONE' && (
                <button
                  onClick={onAccept}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 ui-transition shadow-panel"
                >
                  قبول المهمة
                </button>
              )}
            </>
          )}

        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-appSubtext">الوصف</p>
          <p className="text-sm text-appText bg-appMuted p-2 rounded-lg">
            {selectedTask.description || 'لا يوجد وصف'}
          </p>
        </div>

        {canManage && (<div>
          <p className="text-xs text-appSubtext">الموظف المسؤل</p>
          <p className="text-sm text-appText">
            {selectedTask.assignedToName || 'غير محدد'}
          </p>
        </div>)}

        <div>
          <p className="text-xs text-appSubtext">موعد التسليم</p>
          <p className="text-sm text-appText">
            {selectedTask.dueDate
              ? new Date(selectedTask.dueDate).toLocaleString()
              : 'غير محدد'}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs text-appSubtext">المهام الفرعية</p>
            {subtasks.length > 0 && (
              <span className="text-[11px] px-2 py-1 rounded-lg bg-badgeBlueBg text-badgeBlueText border border-appBorder">
                {subtasks.filter((s) => s.status === 'DONE').length}/{subtasks.length} مكتملة
              </span>
            )}
          </div>

          {subtaskActionError && (
            <p className="text-xs text-danger bg-badgeRedBg border border-appBorder rounded-xl px-3 py-2 mb-2">
              {subtaskActionError}
            </p>
          )}

          {subtasks.length === 0 ? (
            <p className="text-xs text-appSubtext bg-appMuted p-2 rounded-lg">
              لا توجد مهام فرعية
            </p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {subtasks.map((subtask) => {
                const isMine = user && String(subtask.assignedToId) === currentUserId;
                const isBusy = subtaskActionId === subtask.id;
                const canClaimFreeSubtask =
                  user &&
                  !canManage &&
                  !subtask.assignedToId &&
                  subtask.status !== 'DONE' &&
                  (selectedTask.free || workingUserIds.includes(currentUserId));
                return (
                  <div
                    key={subtask.id}
                    className="border border-appBorder rounded-xl p-3 bg-appMuted/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-appText">
                          {subtask.title}
                        </p>
                        {subtask.description && (
                          <p className="text-xs text-appSubtext mt-1">
                            {subtask.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-appSubtext">
                          <span>الموظف: {subtask.assignedToName || 'غير محدد'}</span>
                          <span>
                            التسليم: {subtask.dueDate ? new Date(subtask.dueDate).toLocaleString() : 'غير محدد'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-[11px] px-2 py-1 rounded-lg bg-appSurface text-appSubtext border border-appBorder">
                          {SUBTASK_STATUS_LABELS[subtask.status] || subtask.status}
                        </span>
                        {isMine && subtask.status !== 'DONE' && (
                          <button
                            type="button"
                            onClick={() => handleSubtaskAction(subtask, subtask.status === 'PENDING' ? 'start' : 'complete')}
                            disabled={isBusy}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-brand rounded-lg hover:bg-brandDeep disabled:opacity-50 ui-transition"
                          >
                            {isBusy ? '...' : subtask.status === 'PENDING' ? 'بدء العمل' : 'إنهاء'}
                          </button>
                        )}
                        {canClaimFreeSubtask && (
                          <button
                            type="button"
                            onClick={() => handleClaimSubtask(subtask)}
                            disabled={isBusy}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-brand rounded-lg hover:bg-brandDeep disabled:opacity-50 ui-transition"
                          >
                            {isBusy ? '...' : 'استلام'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs text-appSubtext mb-2">التعليقات</p>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(selectedTask.comments || []).length === 0 ? (
              <p className="text-xs text-appSubtext">لا توجد تعليقات</p>
            ) : (
              selectedTask.comments.map((c, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 bg-appMuted p-2 rounded-lg"
                >
                  <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center text-xs font-semibold">
                    {c.createdByName?.charAt(0) || c.createdBy?.charAt(0) || '?'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-appText">
                      {c.createdByName || c.createdBy || 'Unknown'}
                    </span>
                    <span className="text-xs text-appSubtext">
                      {c.message || c.comment || 'comment not avaliable for now for technical issue'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <AddCommentBox task={selectedTask} setTasks={setTasks} setSelectedTask={setSelectedTask} />
        </div>
      </div>
    </Modal>
  );
}

export default TaskDetailsModel;
