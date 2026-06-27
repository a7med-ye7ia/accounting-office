import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  FileSignature,
  FileText,
  FolderOpen,
  Search,
  Plus,
  AlertCircle,
} from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import StatCard from "../../../components/StatCard";
import NewCompanyModal from "./NewCompanyModel";
import { fetchCompanies } from "../../../api/companies";
import { getApiErrorMessage } from "../../../utils/apiError";
import { formatDateTimeShort } from "../../../utils/dashboardFormat";

const FILTERS = [
  { id: "ALL", label: "كل الشركات" },
  { id: "CREATING", label: "لديها تأسيس" },
  { id: "UPDATING", label: "لديها تعديلات" },
  { id: "NO_CONTRACT", label: "بدون عقود" },
];

function isActiveCompany(company) {
  if (!company) return false;
  if (company.deletedAt != null) return false;
  return company.status == null || company.status === "ACTIVE";
}

function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

export default function CompaniesViewer() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchCompanies();
        if (cancelled) return;
        setCompanies(Array.isArray(response) ? response : []);
      } catch (e) {
        if (!cancelled) setError(getApiErrorMessage(e, "تعذر تحميل الشركات."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCompanies();
    return () => {
      cancelled = true;
    };
  }, []);

  const enrichedCompanies = useMemo(() => {
    return companies.map((company) => {
      const contracts = Array.isArray(company.contracts) ? company.contracts : [];
      const creationCount = contracts.filter((contract) => contract.type === "CREATING").length;
      const updatingCount = contracts.filter((contract) => contract.type === "UPDATING").length;
      return {
        ...company,
        contracts,
        creationCount,
        updatingCount,
        contractCount: contracts.length,
        active: isActiveCompany(company),
      };
    });
  }, [companies]);

  const activeCompanies = useMemo(
    () => enrichedCompanies.filter((company) => company.active),
    [enrichedCompanies],
  );

  const allContracts = useMemo(
    () => activeCompanies.flatMap((company) => company.contracts),
    [activeCompanies],
  );

  const handleNewCompanyCreated = (newCompany) => {
    setCompanies((prev) => [newCompany, ...prev]);
  };

  const totals = useMemo(() => {
    const creationContracts = allContracts.filter((contract) => contract.type === "CREATING").length;
    const updatingContracts = allContracts.filter((contract) => contract.type === "UPDATING").length;
    return {
      companyCount: activeCompanies.length,
      creationContracts,
      updatingContracts,
      totalContracts: allContracts.length,
    };
  }, [activeCompanies, allContracts]);

  const filteredCompanies = useMemo(() => {
    const normalizedSearch = normalizeString(search);
    return activeCompanies.filter((company) => {
      if (activeFilter === "CREATING" && company.creationCount === 0) return false;
      if (activeFilter === "UPDATING" && company.updatingCount === 0) return false;
      if (activeFilter === "NO_CONTRACT" && company.contractCount > 0) return false;

      if (!normalizedSearch) return true;
      return (
        normalizeString(company.companyName).includes(normalizedSearch) ||
        normalizeString(company.companyType).includes(normalizedSearch)
      );
    });
  }, [activeCompanies, activeFilter, search]);

  return (
    <MainLayout title="الشركات والعقود" subtitle="إدارة الشركات">
      <div className="space-y-8">
        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-badgeRedBg/25 px-4 py-3 text-sm text-appText shadow-inner"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border border-appBorder bg-appSurface px-3 py-1.5 text-xs font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand"
            >
              إعادة التحميل
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="عقد تعديل" value={totals.updatingContracts} tone="text-appText" />
          <StatCard label="عقد تأسيس" value={totals.creationContracts} tone="text-appText" />
          <StatCard label="عقد ملف" value={totals.totalContracts} tone="text-appText" />
          <StatCard label="شركة" value={totals.companyCount} tone="text-appText" />
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-appBorder bg-appSurface p-5 shadow-raise sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ui-transition ${
                    isActive
                      ? "border-brand bg-brand text-white"
                      : "border-appBorder bg-appMuted text-appText hover:border-brand/60 hover:bg-appMuted/90"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 items-center justify-between gap-3 min-w-0 sm:max-w-[420px]">
            <label className="relative w-full">
              <Search className="pointer-events-none absolute inset-y-0 start-4 my-auto h-4 w-4 text-appSubtext" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم الشركة أو النوع"
                className="w-full rounded-2xl border border-appBorder bg-appMuted/80 py-3 pe-4 ps-11 text-sm text-appText placeholder:text-appSubtext focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </label>
            <button
              type="button"
              onClick={() => setShowNewCompanyModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand to-brandDeep px-4 py-3 text-sm font-bold text-white shadow-panel ui-transition hover:brightness-110"
            >
              <Plus size={16} />
              إضافة شركة
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-3xl border border-appBorder bg-appMuted/80"
                />
              ))
            : filteredCompanies.length === 0
            ? (
                <div className="rounded-3xl border border-appBorder bg-appSurface p-8 text-center text-sm text-appSubtext">
                  لا توجد شركات تطابق المعايير الحالية.
                </div>
              )
            : filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className="overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-raise"
                >
                  <div className="space-y-5 p-6 sm:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <span className="inline-flex rounded-full bg-badgeBlueBg px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-badgeBlueText">
                          {company.companyType || "غير محدد"}
                        </span>
                        <h2 className="mt-4 text-xl font-semibold text-appText sm:text-2xl">
                          {company.companyName || "اسم الشركة"}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-appSubtext">
                          آخر تحديث: {formatDateTimeShort(company.updatedAt)}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-3xl border border-appBorder bg-badgeBlueBg px-4 py-3 text-sm font-bold text-badgeBlueText">
                        شركة
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl border border-appBorder bg-appMuted/70 p-4 text-center">
                        <p className="text-sm text-appSubtext">تأسيس</p>
                        <p className="mt-3 text-2xl font-semibold text-appText">{company.creationCount}</p>
                      </div>
                      <div className="rounded-3xl border border-appBorder bg-appMuted/70 p-4 text-center">
                        <p className="text-sm text-appSubtext">تعديل</p>
                        <p className="mt-3 text-2xl font-semibold text-appText">{company.updatingCount}</p>
                      </div>
                      <div className="rounded-3xl border border-appBorder bg-appMuted/70 p-4 text-center">
                        <p className="text-sm text-appSubtext">ملف</p>
                        <p className="mt-3 text-2xl font-semibold text-appText">{company.contractCount}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3 text-sm text-appSubtext">
                        <FolderOpen className="h-4 w-4 text-appSubtext" />
                        <span>عدد العقود: {company.contractCount}</span>
                      </div>
                      <Link
                        to={`/companies/company/${company.id}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white shadow-panel ui-transition hover:brightness-110"
                      >
                        فتح ملف الشركة
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
      {showNewCompanyModal && (
        <NewCompanyModal
          onClose={() => setShowNewCompanyModal(false)}
          onCreated={(newCompany) => {
            handleNewCompanyCreated(newCompany);
            setShowNewCompanyModal(false);
          }}
        />
      )}
    </MainLayout>
  );
}
