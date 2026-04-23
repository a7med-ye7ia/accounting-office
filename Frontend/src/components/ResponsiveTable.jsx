import StatusBadge from "./StatusBadge";

function ResponsiveTable({ columns, rows }) {
  return (
    <div>
      <div className="hidden overflow-x-auto md:block" dir="rtl">
        <table className="w-full min-w-[700px] text-right" style={{ direction: 'rtl' }}>
          <thead>
            <tr className="bg-slate-100">
              {columns.map((column) => (
                <th key={column.key} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id ?? idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-slate-800 text-right">
                    {column.type === "status" ? <StatusBadge status={row[column.key]} /> : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 md:hidden">
        {rows.map((row, idx) => (
          <div key={row.id ?? idx} className="rounded-xl bg-white p-4">
            {columns.map((column) => (
              <div key={column.key} className="mb-2 flex items-start justify-between gap-3 text-sm last:mb-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{column.label}</span>
                <span className="text-right text-slate-800">
                  {column.type === "status" ? <StatusBadge status={row[column.key]} /> : row[column.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsiveTable;
