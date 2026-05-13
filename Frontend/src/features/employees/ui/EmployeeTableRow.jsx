import React from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar, StatusBadge } from "../../../shared/components/HrShared";

function formatHireDate(value) {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

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
    <tr className="border-b border-slate-100 hover:bg-appMuted transition-colors">
      <td className="ps-6 pe-4 py-4" />
      <td className="ps-4 pe-4 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/profile/${emp.id}`)}
            className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-appSurface shrink-0"
            aria-label="عرض ملف الموظف"
          >
            <Avatar initials={initials} />
          </button>
          <div>
            <p className="font-semibold text-appText text-sm">{emp.fullName || emp.name}</p>
            <p className="text-[11px] text-appSubtext">{emp.email}</p>
          </div>
        </div>
      </td>
      <td className="ps-4 pe-4 py-4 text-appSubtext text-sm">{roleLabel}</td>
      <td className="ps-4 pe-4 py-4">
        <span className="inline-flex items-center ps-2.5 pe-2.5 py-0.5 rounded-full text-xs font-semibold bg-badgeBlueBg text-badgeBlueText">
          {deptLabel}
        </span>
      </td>
      <td className="ps-4 pe-4 py-4 text-appSubtext text-sm">{formatHireDate(emp.hireDate)}</td>
      <td className="ps-4 pe-4 py-4">
        <StatusBadge status={statusForBadge} />
      </td>
      <td className="ps-4 pe-4 py-4">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(emp)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand hover:bg-blue-50 transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(emp.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default EmployeeTableRow;
