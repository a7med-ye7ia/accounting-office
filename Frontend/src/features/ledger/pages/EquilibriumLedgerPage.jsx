import MainLayout from "../../../shared/layout/MainLayout";
import useMockAsyncData from "../../../shared/hooks/useMockAsyncData";
import { fetchLedger } from "../../../api/ledger";
import useLedgerFilters from "../hooks/useLedgerFilters";
import { getStatusTone } from "../services/statusTone";
import { useTranslation } from "react-i18next";

function EquilibriumLedgerPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMockAsyncData(fetchLedger, []);
  const { currencyFilter, setCurrencyFilter, sortDirection, setSortDirection, pageIndex, setPageIndex, filteredRows, paginatedRows, maxPage } =
    useLedgerFilters(data);

  const kpi = {
    totalEntries: filteredRows.length,
    totalEgp: filteredRows.filter((row) => row.currency === "EGP").length,
    totalSar: filteredRows.filter((row) => row.currency === "SAR").length,
    overdue: filteredRows.filter((row) => row.status === "Overdue").length,
  };

  return (
    <MainLayout title={t('ledger.title')} subtitle={t('ledger.subtitle')}>
      <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel"><p className="text-xs uppercase tracking-wider text-appSubtext">{t('ledger.ledgerEntries')}</p><p className="mt-2 text-3xl font-extrabold">{kpi.totalEntries}</p></div>
        <div className="rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel"><p className="text-xs uppercase tracking-wider text-appSubtext">{t('ledger.egpRows')}</p><p className="mt-2 text-3xl font-extrabold text-brand">{kpi.totalEgp}</p></div>
        <div className="rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel"><p className="text-xs uppercase tracking-wider text-appSubtext">{t('ledger.sarRows')}</p><p className="mt-2 text-3xl font-extrabold text-brand">{kpi.totalSar}</p></div>
        <div className="rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel"><p className="text-xs uppercase tracking-wider text-appSubtext">{t('ledger.overdue')}</p><p className="mt-2 text-3xl font-extrabold text-danger">{kpi.overdue}</p></div>
      </div>
      <section className="mt-6 rounded-2xl border border-appBorder bg-appSurface shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <h3 className="text-xl font-bold text-appText">{t('ledger.multiCurrencyGrid')}</h3>
          <div className="flex items-center gap-2">
            <select value={currencyFilter} onChange={(event) => { setCurrencyFilter(event.target.value); setPageIndex(0); }} className="rounded-lg bg-appMuted px-3 py-2 text-sm">
              <option value="ALL">{t('ledger.allCurrencies')}</option>
              <option value="EGP">EGP</option>
              <option value="SAR">SAR</option>
            </select>
            <button className="rounded-lg bg-appMuted px-3 py-2 text-sm font-semibold" onClick={() => setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))}>
              {t('ledger.sort')}: {sortDirection === "desc" ? t('ledger.newest') : t('ledger.oldest')}
            </button>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="grid grid-cols-6 bg-appMuted px-5 py-3 text-xs font-bold uppercase tracking-wider text-appSubtext border-b border-appBorder sticky top-0 z-10 backdrop-blur-sm">
            <p>{t('ledger.entryId')}</p><p>{t('ledger.company')}</p><p>{t('ledger.department')}</p><p className="text-right">{t('ledger.amount')}</p><p>{t('ledger.currency')}</p><p>{t('ledger.status')}</p>
          </div>
          {isLoading ? (
            <div className="p-5 text-sm text-appSubtext">{t('ledger.loading')}</div>
          ) : (
            paginatedRows.map((row, index) => (
              <div key={row.id} className={`grid grid-cols-6 px-5 py-4 text-sm ${index % 2 === 0 ? "bg-appSurface" : "bg-appMuted/50"}`}>
                <p className="font-semibold">{row.id}</p>
                <p>{row.company}</p>
                <p>{row.department}</p>
                <p className="text-right font-semibold tabular-nums">{row.amount}</p>
                <p>{row.currency}</p>
                <p><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(row.status)}`}>{row.status}</span></p>
              </div>
            ))
          )}
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {paginatedRows.map((row) => (
            <div key={row.id} className="rounded-xl bg-appMuted p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-appSubtext">{row.id}</p>
              <p className="mt-2 text-sm font-semibold">{row.company}</p>
              <p className="mt-1 text-sm text-appSubtext">{row.department}</p>
              <p className="mt-3 text-sm font-bold tabular-nums">{row.amount}</p>
              <p className="mt-1 text-xs text-appSubtext">{row.currency}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-appBorder px-5 py-4">
          <p className="text-xs text-appSubtext">{t('ledger.page')} {pageIndex + 1} {t('ledger.of')} {maxPage + 1}</p>
          <div className="flex gap-2">
            <button className="rounded bg-appMuted px-3 py-1 text-sm disabled:opacity-40" disabled={pageIndex === 0} onClick={() => setPageIndex((prev) => prev - 1)}>{t('common.previous')}</button>
            <button className="rounded bg-appMuted px-3 py-1 text-sm disabled:opacity-40" disabled={pageIndex >= maxPage} onClick={() => setPageIndex((prev) => prev + 1)}>{t('common.next')}</button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

export default EquilibriumLedgerPage;
