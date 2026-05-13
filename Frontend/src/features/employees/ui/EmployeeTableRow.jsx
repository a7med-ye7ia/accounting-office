import React from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar, StatusBadge } from "../../../shared/components/HrShared";
import { formatDisplayDate } from "../../../utils/dateFormat";

/**
 * Single employee row for the directory table. Avatar navigates to full profile.
 */
export function EmployeeTableRow({
  emp,
  roleLabel,
  deptLabel,
  statusForBadge,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();
  const initials = emp.avatar || emp.fullName?.substring(0, 2).toUpperCase() || "US";

  return (
    <tr className="table-row-interactive">
      <td className="ps-6 pe-4 py-4 text-start" />
      <td className="ps-4 pe-4 py-4 text-start">
        <div className="flex items-center justify-start gap-3">
          <button
            type="button"
            onClick={() => navigate(`/profile/${emp.id}`)}
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-appSurface shrink-0"
            aria-label="عرض ملف الموظف"
          >
            <Avatar initials={initials} />
          </button>
          <div className="min-w-0 text-start" dir="auto">
            <p className="text-sm font-semibold text-appText">{emp.fullName || emp.name}</p>
            <p className="text-[11px] text-appSubtext">{emp.email}</p>
          </div>
        </div>
      </td>
      <td className="ps-4 pe-4 py-4 text-start text-sm text-appSubtext" dir="auto">
        {roleLabel}
      </td>
      <td className="ps-4 pe-4 py-4 text-start">
        <span
          className="inline-flex items-center rounded-full bg-badgeBlueBg px-2.5 py-0.5 text-xs font-semibold text-badgeBlueText"
          dir="auto"
        >
          {deptLabel}
        </span>
      </td>
      <td className="ps-4 pe-4 py-4 text-start text-sm text-appSubtext">
        {formatDisplayDate(emp.hireDate)}
      </td>
      <td className="ps-4 pe-4 py-4 text-start">
        <StatusBadge status={statusForBadge} />
      </td>
      <td className="ps-4 pe-4 py-4 text-start">
        <div className="flex items-center justify-start gap-1">
          <button
            type="button"
            onClick={() => onEdit(emp)}
            className="p-2 rounded-xl text-appSubtext hover:text-brand hover:bg-badgeBlueBg/50 ui-transition"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(emp.id)}
            className="p-2 rounded-xl text-appSubtext hover:text-danger hover:bg-badgeRedBg/50 ui-transition"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default EmployeeTableRow;
