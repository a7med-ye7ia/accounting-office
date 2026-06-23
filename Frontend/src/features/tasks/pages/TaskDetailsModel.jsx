import React, { useState } from 'react';
import { Modal } from '../../../shared/components/HrShared';
import { addCommentToTask } from '../../../api/comments';

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

function TaskDetailsModel({ selectedTask, setTasks, onClose, onDelete, onAccept, setSelectedTask }) {
  if (!selectedTask) return null;
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  // console.log('Current user:', user);
  console.log('Selected task:', selectedTask);
  const isOwner = user ? user.roleName === 'owner' : false;


  return (
    <Modal
      title={selectedTask.title || 'تفاصيل المهمة'}
      onClose={onClose}
      footer={
        <>
          {isOwner && (
            <>
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

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-xl hover:bg-slate-700 ui-transition shadow-panel"
          >
            اغلاق
          </button>
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

        {isOwner && (<div>
          <p className="text-xs text-appSubtext">الموظف المسؤال</p>
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
