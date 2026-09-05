import React, { useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import ActivityHistory from "./ActivityHistory";
import { fetchActivityLogs } from "../../../api/activityLogs";
import { getApiErrorMessage } from "../../../utils/apiError";

function ActivityHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchActivityLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e, "تعذر تحميل سجل النشاطات."));
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <MainLayout title="سجل النشاطات" subtitle="Activity History">
      <div className="space-y-5">
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-badgeRedBg/25 px-4 py-3 text-sm text-appText shadow-inner">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex items-center gap-1.5 rounded-xl border border-appBorder bg-appSurface px-3 py-1.5 text-xs font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand"
            >
              <RefreshCw size={13} /> إعادة المحاولة
            </button>
          </div>
        )}

        <ActivityHistory logs={logs} loading={loading} onRetry={loadData} />
      </div>
    </MainLayout>
  );
}

export default ActivityHistoryPage;
