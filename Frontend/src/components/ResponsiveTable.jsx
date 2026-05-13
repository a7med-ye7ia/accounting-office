import StatusBadge from "./StatusBadge";

function ResponsiveTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-raise">
      <div className="hidden md:block" dir="rtl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-right" style={{ direction: "rtl" }}>
            <thead className="sticky top-0 z-20 table-head-surface backdrop-blur-md">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-4 text-end text-[10px] font-extrabold uppercase tracking-[0.18em] text-appSubtext first:ps-8 last:pe-8 sm:py-5"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-appBorder/80">
              {rows.map((row, idx) => (
                <tr
                  key={row.id ?? idx}
                  className={`table-row-interactive ${
                    idx % 2 === 0 ? "bg-appSurface" : "bg-appMuted/35"
                  }`}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 text-sm text-appText first:ps-8 last:pe-8 sm:py-[1.125rem]"
                    >
                      {column.type === "status" ? (
                        <StatusBadge status={row[column.key]} />
                      ) : (
                        <span className="font-medium">{row[column.key]}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5 md:hidden">
        {rows.map((row, idx) => (
          <div
            key={row.id ?? idx}
            className="rounded-2xl border border-appBorder bg-appMuted/25 p-5 shadow-panel ui-transition hover:border-brand/25 hover:shadow-raise"
          >
            {columns.map((column) => (
              <div
                key={column.key}
                className="mb-4 flex items-start justify-between gap-4 border-b border-appBorder/60 pb-4 text-sm last:mb-0 last:border-b-0 last:pb-0"
              >
                <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-appSubtext shrink-0">
                  {column.label}
                </span>
                <span className="text-end font-semibold text-appText">
                  {column.type === "status" ? (
                    <StatusBadge status={row[column.key]} />
                  ) : (
                    row[column.key]
                  )}
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
