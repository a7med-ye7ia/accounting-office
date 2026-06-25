import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Building2,
  FilePenLine,
  FileText,
  FolderOpen,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { getCompanyContractCounts } from "../services/companyWorkflow";

const FILTERS = [
  { key: "all", label: "كل الشركات" },
  { key: "establishment", label: "لديها تأسيس" },
  { key: "amendment", label: "لديها تعديلات" },
  { key: "empty", label: "بدون عقود" },
];

const SORTS = [
  { key: "name", label: "الاسم" },
  { key: "contracts", label: "عدد العقود" },
  { key: "type", label: "نوع الشركة" },
];

function StatTile({ icon, label, value, tone = "brand" }) {
  const IconComponent = icon;
  const toneClass =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900"
      : tone === "purple"
        ? "bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-200 dark:border-violet-900"
        : "bg-badgeBlueBg text-badgeBlueText border-appBorder";

  return (
    <div className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${toneClass}`}>
          <IconComponent className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="text-left" dir="rtl">
          <p className="text-2xl font-bold text-appText tabular-nums">{value}</p>
          <p className="text-xs font-medium text-appSubtext">{label}</p>
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ company, onSelectCompany }) {
  const counts = getCompanyContractCounts(company);
  const initials = (company.name || "?").trim().slice(0, 2);

  return (
    <button
      type="button"
      onClick={() => onSelectCompany(company)}
      className="group grid min-h-[188px] rounded-lg border border-appBorder bg-appSurface p-5 text-right shadow-panel ui-transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-panelStrong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-appBorder bg-appMuted px-2.5 py-1 text-xs font-semibold text-appSubtext">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="truncate">{company.description || "غير محدد"}</span>
          </div>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-appText group-hover:text-brand">
            {company.name}
          </h3>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-sm font-bold text-brand">
          {initials}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-appBorder bg-badgeBlueBg/55 px-3 py-2">
          <div className="flex items-center gap-1.5 text-badgeBlueText">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[11px] font-semibold">تأسيس</span>
          </div>
          <p className="mt-1 text-lg font-bold text-appText tabular-nums">{counts.establishment}</p>
        </div>
        <div className="rounded-lg border border-appBorder bg-badgePurpleBg/60 px-3 py-2">
          <div className="flex items-center gap-1.5 text-badgePurpleText">
            <FilePenLine className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[11px] font-semibold">تعديل</span>
          </div>
          <p className="mt-1 text-lg font-bold text-appText tabular-nums">{counts.amendment}</p>
        </div>
        <div className="rounded-lg border border-appBorder bg-appMuted px-3 py-2">
          <div className="flex items-center gap-1.5 text-appSubtext">
            <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[11px] font-semibold">الإجمالي</span>
          </div>
          <p className="mt-1 text-lg font-bold text-appText tabular-nums">{counts.total}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-appBorder pt-3 text-xs text-appSubtext">
        <span>فتح ملف الشركة</span>
        <span className="text-brand opacity-0 ui-transition group-hover:opacity-100">عرض العقود</span>
      </div>
    </button>
  );
}

function CompaniesEmptyState({ onAddCompany }) {
  return (
    <section className="rounded-lg border border-dashed border-appBorder bg-appSurface p-10 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-appBorder bg-appMuted text-brand">
        <Building2 className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-appText">لا توجد شركات بعد</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-appSubtext">
        ابدأ بإضافة شركة جديدة ليظهر ملفها وعقودها هنا.
      </p>
      {onAddCompany && (
        <button
          type="button"
          onClick={onAddCompany}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white ui-transition hover:bg-brandDeep"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          إضافة شركة
        </button>
      )}
    </section>
  );
}

export default function CompanyList({ companies = [], onSelectCompany, onAddCompany }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const stats = useMemo(() => {
    return companies.reduce(
      (acc, company) => {
        const counts = getCompanyContractCounts(company);
        acc.totalCompanies += 1;
        acc.totalContracts += counts.total;
        acc.establishment += counts.establishment;
        acc.amendment += counts.amendment;
        return acc;
      },
      { totalCompanies: 0, totalContracts: 0, establishment: 0, amendment: 0 }
    );
  }, [companies]);

  const visibleCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return companies
      .filter((company) => {
        const counts = getCompanyContractCounts(company);
        const matchesQuery =
          !normalizedQuery ||
          [company.name, company.description]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedQuery));

        const matchesFilter =
          filter === "all" ||
          (filter === "establishment" && counts.establishment > 0) ||
          (filter === "amendment" && counts.amendment > 0) ||
          (filter === "empty" && counts.total === 0);

        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === "contracts") {
          return getCompanyContractCounts(b).total - getCompanyContractCounts(a).total;
        }
        if (sortBy === "type") {
          return String(a.description || "").localeCompare(String(b.description || ""), "ar");
        }
        return String(a.name || "").localeCompare(String(b.name || ""), "ar");
      });
  }, [companies, filter, query, sortBy]);

  return (
    <div className="animate-fadeIn space-y-6">
      <section className="rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">إدارة الشركات</p>
            <h2 className="mt-1 text-2xl font-bold text-appText md:text-3xl">الشركات والعقود</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-appSubtext">
              اختر شركة لعرض عقود التأسيس والتعديل والملفات المرتبطة بها.
            </p>
          </div>

          {onAddCompany && (
            <button
              type="button"
              onClick={onAddCompany}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white shadow-panel ui-transition hover:bg-brandDeep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              إضافة شركة
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatTile icon={Building2} label="شركة" value={stats.totalCompanies} />
        <StatTile icon={FolderOpen} label="عقد وملف" value={stats.totalContracts} tone="success" />
        <StatTile icon={FileText} label="عقود تأسيس" value={stats.establishment} />
        <StatTile icon={FilePenLine} label="عقود تعديل" value={stats.amendment} tone="purple" />
      </div>

      <section className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-appSubtext" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-lg border border-appBorder bg-appMuted py-2 pl-3 pr-10 text-sm text-appText outline-none ui-transition placeholder:text-appSubtext focus:border-brand focus:bg-appSurface focus:ring-2 focus:ring-brand/15"
              placeholder="ابحث باسم الشركة أو النوع"
              type="search"
            />
          </label>

          <div className="flex items-center gap-2 rounded-lg border border-appBorder bg-appMuted p-1">
            <SlidersHorizontal className="mr-2 h-4 w-4 text-appSubtext" aria-hidden="true" />
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`h-9 rounded-md px-3 text-xs font-bold ui-transition ${
                  filter === item.key
                    ? "bg-appSurface text-brand shadow-sm"
                    : "text-appSubtext hover:text-appText"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="flex h-11 items-center gap-2 rounded-lg border border-appBorder bg-appMuted px-3 text-sm text-appSubtext">
            <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-full bg-transparent text-sm font-semibold text-appText outline-none"
            >
              {SORTS.map((item) => (
                <option key={item.key} value={item.key}>
                  ترتيب حسب {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {companies.length === 0 ? (
        <CompaniesEmptyState onAddCompany={onAddCompany} />
      ) : visibleCompanies.length === 0 ? (
        <section className="rounded-lg border border-appBorder bg-appSurface p-8 text-center shadow-panel">
          <Search className="mx-auto h-8 w-8 text-appSubtext" aria-hidden="true" />
          <h3 className="mt-3 text-base font-bold text-appText">لا توجد نتائج مطابقة</h3>
          <p className="mt-1 text-sm text-appSubtext">جرّب تعديل البحث أو الفلتر الحالي.</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCompanies.map((company) => (
            <CompanyCard key={company.id} company={company} onSelectCompany={onSelectCompany} />
          ))}
        </div>
      )}
    </div>
  );
}
