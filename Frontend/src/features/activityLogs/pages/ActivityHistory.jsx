import React, { useState, useMemo } from "react";
import { Clock, History, AlertCircle, Loader2, Search } from "lucide-react";

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseMetadata(metadataString) {
  if (!metadataString) return null;
  try {
    return JSON.parse(metadataString);
  } catch {
    return null;
  }
}

function ActivityHistory({ logs, loading, onRetry }) {
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.trim().toLowerCase();
    return logs.filter((log) => {
      const summary = (log.summary || "").toLowerCase();
      const action = (log.action || "").toLowerCase();
      const entity = (log.entityType || "").toLowerCase();
      const user = (log.userName || "").toLowerCase();
      const userId = String(log.userId || "");
      return summary.includes(q) || action.includes(q) || entity.includes(q) || user.includes(q) || userId.includes(q);
    });
  }, [logs, search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-appBorder bg-appSurface px-6 py-16 shadow-raise">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="text-sm font-semibold text-appSubtext">جاري تحميل النشاطات...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-appBorder bg-appSurface px-6 py-16 shadow-raise">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-appBorder bg-appMuted">
          <History className="text-appSubtext" size={26} />
        </div>
        <p className="text-sm font-semibold text-appText">لا توجد نشاطات مسجلة</p>
        <p className="max-w-sm text-xs text-appSubtext">عند حدوث أي نشاط في النظام سيظهر هنا.</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-appBorder bg-appMuted px-3 py-1.5 text-xs font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand"
          >
            <Loader2 size={13} /> تحديث
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-appSubtext" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في سجل النشاطات..."
            className="w-full rounded-2xl border border-appBorder bg-appSurface py-2 pl-4 pr-10 text-xs font-medium text-appText shadow-inner placeholder:text-appSubtext ui-transition hover:border-brand/30 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="text-xs font-semibold text-appSubtext">
          إجمالي النشاطات: <span className="font-bold text-appText">{filteredLogs.length}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-raise">
        <div className="divide-y divide-appBorder/80">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs font-medium text-appSubtext">
              لا توجد نتائج مطابقة لبحثك.
            </div>
          ) : (
            filteredLogs.map((log) => {
          const metadata = parseMetadata(log.metadata);
          return (
            <div key={log.id} className="table-row-interactive px-5 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Clock size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-appText">{log.summary}</p>
                    <p className="mt-0.5 text-xs text-appSubtext">
                      <span className="font-semibold">{log.action}</span>
                      {" | "}
                      <span>{log.entityType}</span>
                      {" | "}
                      <span>{log.userName || `المستخدم #${log.userId}`}</span>
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] font-medium text-appSubtext">
                  {formatDate(log.createdAt)}
                </span>
              </div>

              {metadata && (
                <div className="mt-3 rounded-2xl border border-appBorder bg-appMuted/60 px-4 py-3">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-appSubtext">
                    التفاصيل
                  </p>
                  {metadata.changes ? (
                    <div className="space-y-1.5 text-xs text-appText">
                      {metadata.changes.map((c, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-xl bg-appMuted/60 px-3 py-2">
                          <span className="font-bold text-appSubtext">{c.field}:</span>
                          <span className="line-through text-danger/70">{c.old}</span>
                          <span className="text-appSubtext/50">←</span>
                          <span className="font-semibold text-success">{c.new}</span>
                        </div>
                      ))}
                    </div>
                  ) : metadata.sections ? (
                    <div className="space-y-3 text-xs text-appText">
                      {metadata.sections.map((s, i) => (
                        <div key={i} className="rounded-xl border border-appBorder bg-appSurface/60 overflow-hidden">
                          <div className="bg-appMuted/50 px-3 py-1.5 text-[11px] font-bold text-appSubtext border-b border-appBorder">
                            {s.selectedArticleTitle || `المادة #${i + 1}`}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-appBorder">
                            <div className="p-3 space-y-1">
                              <span className="text-[10px] font-bold text-danger/70 uppercase tracking-wider">قبل</span>
                              <p className="whitespace-pre-wrap leading-relaxed">{s.beforeText}</p>
                            </div>
                            <div className="p-3 space-y-1">
                              <span className="text-[10px] font-bold text-success uppercase tracking-wider">بعد</span>
                              <p className="whitespace-pre-wrap leading-relaxed">{s.afterText}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs text-appText">
                      {Object.entries(metadata).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-semibold text-appSubtext">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
        </div>
      </div>
    </div>
  );
}

export default ActivityHistory;
