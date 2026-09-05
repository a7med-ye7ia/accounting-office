import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteConfirmModal({
  open,
  title = "حذف المهمة",
  message = "هل أنت متأكد من حذف هذه المهمة؟ لا يمكن التراجع عن هذا الإجراء.",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-appSurface rounded-xl shadow-xl w-full max-w-sm p-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3 end-3 w-7 h-7 rounded-lg flex items-center justify-center text-appSubtext hover:text-brand hover:bg-appMuted ui-transition"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-red-100 text-red-600 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-appText">{title}</h3>
            <p className="text-sm text-appSubtext mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-appSubtext hover:bg-appMuted ui-transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 ui-transition"
          >
            حذف
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}