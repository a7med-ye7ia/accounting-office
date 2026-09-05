import { useEffect, useMemo, useState } from "react";
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
import { useNavigate } from "react-router-dom";

import MainLayout from "../../../shared/layout/MainLayout";
import { fetchCompanies } from "../../../api/companies";
import AddCompanyModal from "./AddCompanyModel";

export default function CompaniesPage({ basePath = "/companies2" }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companies, setCompanies] = useState([]);

    useEffect(() => {
      const fetch = async () => {
        const data = await fetchCompanies();
        setCompanies(data);
      };

      fetch();
    }, []);

  return (
    <MainLayout
      title="الشركات والعقود"
      subtitle="الشركات"
      actions={
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white shadow-panel ui-transition hover:bg-brandDeep"
        >
          <Plus className="h-4 w-4" />
          إضافة شركة
        </button>
      }
    >
      <CompaniesContent basePath={basePath} companies={companies} setCompanies={setCompanies} />

      {/* Render Floating Modal */}
      <AddCompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companies={companies}
        setCompanies={setCompanies}
      />
    </MainLayout>
  );
}

/*
|--------------------------------------------------------------------------
| NEW COMPONENT
|--------------------------------------------------------------------------
|
| Completely independent from the old CompanyList.
|
*/

function CompaniesContent({ basePath, companies, setCompanies }) {
  // const [companies, setCompanies] = useState([]);
  // we will pass them from the parent component to pass them to the model

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");

  const navigate = useNavigate();


  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    let totalContracts = 0;
    let establishment = 0;
    let amendment = 0;
    let other = 0;

    for (const company of companies) {
      let companyEstablishmentContracts = 0;
      let companyAmendmentContracts = 0;
      let companyOtherContracts = 0;
      for(const contract of company.contracts ?? []) {
        companyEstablishmentContracts += contract.type === "CREATING" ? 1 : 0;
        companyAmendmentContracts += contract.type === "UPDATING" ? 1 : 0;
        companyOtherContracts += contract.type === "OTHER" ? 1 : 0;
      }

      // ! add the number of the contracte to each company object to use it in the ui
      company.establishmentContracts = companyEstablishmentContracts;
      company.amendmentContracts = companyAmendmentContracts;
      company.otherContracts = companyOtherContracts;

      establishment += companyEstablishmentContracts;
      amendment += companyAmendmentContracts;
      other += companyOtherContracts;
    }

    totalContracts += establishment + amendment + other;
    return {
      companies: companies.length,
      contracts: totalContracts,
      establishment,
      amendment,
    };
  }, [companies]);


  /*
  |--------------------------------------------------------------------------
  | SEARCH + FILTER + SORT
  |--------------------------------------------------------------------------
  */

  const visibleCompanies = useMemo(() => {
    const q = search.trim().toLowerCase();

    return [...companies]
      .filter((company) => {
        const name =
          String(company.name ?? "").toLowerCase();

        const type =
          String(company.companyType ?? "").toLowerCase();

        const matchesSearch =
          !q ||
          name.includes(q) ||
          type.includes(q);

        const establishment =
          Number(company.establishmentContracts ?? 0);

        const amendment =
          Number(company.amendmentContracts ?? 0);

        const total =
          establishment + amendment;

        let matchesFilter = true;

        if (filter === "establishment") {
          matchesFilter = establishment > 0;
        }

        if (filter === "amendment") {
          matchesFilter = amendment > 0;
        }

        if (filter === "empty") {
          matchesFilter = total === 0;
        }

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sort === "contracts") {
          const aTotal =
            Number(a.establishmentContracts ?? 0) +
            Number(a.amendmentContracts ?? 0);

          const bTotal =
            Number(b.establishmentContracts ?? 0) +
            Number(b.amendmentContracts ?? 0);

          return bTotal - aTotal;
        }

        if (sort === "type") {
          return String(a.type ?? "").localeCompare(
            String(b.type ?? ""),
            "ar"
          );
        }

        return String(a.name ?? "").localeCompare(
          String(b.name ?? ""),
          "ar"
        );
      });
  }, [companies, search, filter, sort]);


  return (
    <div className="space-y-6">


      {/* =====================================================
          STATISTICS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">

        {/* Companies */}
        <div className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand/20 bg-badgeBlueBg text-badgeBlueText">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="text-left" dir="rtl">
              <p className="text-2xl font-bold text-appText tabular-nums">
                {stats.companies}
              </p>

              <p className="text-xs font-medium text-appSubtext">
                شركة
              </p>
            </div>

          </div>
        </div>


        {/* Total contracts */}
        <div className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700">
              <FolderOpen className="h-5 w-5" />
            </div>

            <div className="text-left" dir="rtl">
              <p className="text-2xl font-bold text-appText tabular-nums">
                {stats.contracts}
              </p>

              <p className="text-xs font-medium text-appSubtext">
                عقد وملف
              </p>
            </div>

          </div>
        </div>


        {/* Establishment */}
        <div className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand/20 bg-badgeBlueBg text-badgeBlueText">
              <FileText className="h-5 w-5" />
            </div>

            <div className="text-left" dir="rtl">
              <p className="text-2xl font-bold text-appText tabular-nums">
                {stats.establishment}
              </p>

              <p className="text-xs font-medium text-appSubtext">
                عقود تأسيس
              </p>
            </div>

          </div>
        </div>


        {/* Amendment */}
        <div className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-100 bg-violet-50 text-violet-700">
              <FilePenLine className="h-5 w-5" />
            </div>

            <div className="text-left" dir="rtl">
              <p className="text-2xl font-bold text-appText tabular-nums">
                {stats.amendment}
              </p>

              <p className="text-xs font-medium text-appSubtext">
                عقود تعديل
              </p>
            </div>

          </div>
        </div>

      </div>


      {/* =====================================================
          SEARCH / FILTER / SORT
      ====================================================== */}

      <section className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">


          {/* Search */}
          <label className="relative block">

            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-appSubtext"
            />

            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الشركة أو النوع"
              className="h-11 w-full rounded-lg border border-appBorder bg-appMuted py-2 pl-3 pr-10 text-sm text-appText outline-none ui-transition placeholder:text-appSubtext focus:border-brand focus:bg-appSurface focus:ring-2 focus:ring-brand/15"
            />

          </label>


          {/* Filters */}
          <div className="flex items-center gap-1 rounded-lg border border-appBorder bg-appMuted p-1">

            <SlidersHorizontal className="mr-2 h-4 w-4 text-appSubtext" />

            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`h-9 rounded-md px-3 text-xs font-bold ui-transition ${
                filter === "all"
                  ? "bg-appSurface text-brand shadow-sm"
                  : "text-appSubtext hover:text-appText"
              }`}
            >
              كل الشركات
            </button>

            <button
              type="button"
              onClick={() => setFilter("establishment")}
              className={`h-9 rounded-md px-3 text-xs font-bold ui-transition ${
                filter === "establishment"
                  ? "bg-appSurface text-brand shadow-sm"
                  : "text-appSubtext hover:text-appText"
              }`}
            >
              لديها تأسيس
            </button>

            <button
              type="button"
              onClick={() => setFilter("amendment")}
              className={`h-9 rounded-md px-3 text-xs font-bold ui-transition ${
                filter === "amendment"
                  ? "bg-appSurface text-brand shadow-sm"
                  : "text-appSubtext hover:text-appText"
              }`}
            >
              لديها تعديلات
            </button>

            <button
              type="button"
              onClick={() => setFilter("empty")}
              className={`h-9 rounded-md px-3 text-xs font-bold ui-transition ${
                filter === "empty"
                  ? "bg-appSurface text-brand shadow-sm"
                  : "text-appSubtext hover:text-appText"
              }`}
            >
              بدون عقود
            </button>

          </div>


          {/* Sort */}
          <label className="flex h-11 items-center gap-2 rounded-lg border border-appBorder bg-appMuted px-3 text-sm text-appSubtext">

            <ArrowUpDown className="h-4 w-4" />

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-full bg-transparent text-sm font-semibold text-appText outline-none"
            >
              <option value="name">
                ترتيب حسب الاسم
              </option>

              <option value="contracts">
                ترتيب حسب عدد العقود
              </option>

              <option value="type">
                ترتيب حسب نوع الشركة
              </option>
            </select>

          </label>

        </div>

      </section>


      {/* =====================================================
          COMPANIES
      ====================================================== */}

      {companies.length === 0 ? (

        <section className="rounded-lg border border-dashed border-appBorder bg-appSurface p-10 text-center shadow-panel">

          <Building2 className="mx-auto h-10 w-10 text-appSubtext" />

          <h3 className="mt-4 text-lg font-bold text-appText">
            لا توجد شركات
          </h3>

          <p className="mt-2 text-sm text-appSubtext">
            لم يتم تحميل بيانات الشركات بعد.
          </p>

        </section>

      ) : visibleCompanies.length === 0 ? (

        <section className="rounded-lg border border-appBorder bg-appSurface p-8 text-center shadow-panel">

          <Search className="mx-auto h-8 w-8 text-appSubtext" />

          <h3 className="mt-3 text-base font-bold text-appText">
            لا توجد نتائج مطابقة
          </h3>

          <p className="mt-1 text-sm text-appSubtext">
            جرّب تعديل البحث أو الفلتر الحالي.
          </p>

        </section>

      ) : (

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

          {visibleCompanies.map((company) => {


            const establishment =
              Number(company.establishmentContracts ?? 0);

            const amendment =
              Number(company.amendmentContracts ?? 0);

            const total =
              establishment + amendment;

            const initials =
              String(company.name ?? "?")
                .trim()
                .slice(0, 2);

            return (
              <button
                key={company.id}
                type="button"

                onClick={() => { navigate(`${basePath}/${company.id}`, { state: { company } }) }}
                className="group min-h-[260px] rounded-lg border border-appBorder bg-appSurface p-5 text-right shadow-panel ui-transition hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-panelStrong"
              >

                {/* Company header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 inline-flex max-w-full items-center gap-2 rounded-lg border border-appBorder bg-appMuted px-2.5 py-1 text-xs font-semibold text-appSubtext">

                      <Building2 className="h-3.5 w-3.5 shrink-0" />

                      <span className="truncate">
                        {company.companyType || "غير محدد"}
                      </span>

                    </div>

                    <h3 className="line-clamp-2 text-lg font-bold leading-snug text-appText group-hover:text-brand">
                      {company.name}
                    </h3>
                  </div>


                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-sm font-bold text-brand">
                    {initials}
                  </div>
                </div>


                {/* Contract counters */}
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {/* Establishment */}
                  <div className="rounded-lg border border-appBorder bg-badgeBlueBg/55 px-3 py-3">
                    <div className="flex items-center gap-1.5 text-badgeBlueText">

                      <FileText className="h-3.5 w-3.5" />

                      <span className="text-[11px] font-semibold">
                        تأسيس
                      </span>

                    </div>

                    <p className="mt-1 text-lg font-bold text-appText tabular-nums">
                      {establishment}
                    </p>
                  </div>


                  {/* Amendment */}
                  <div className="rounded-lg border border-appBorder bg-badgePurpleBg/60 px-3 py-3">
                    <div className="flex items-center gap-1.5 text-badgePurpleText">
                      <FilePenLine className="h-3.5 w-3.5" />

                      <span className="text-[11px] font-semibold">
                        تعديل
                      </span>

                    </div>

                    <p className="mt-1 text-lg font-bold text-appText tabular-nums">
                      {amendment}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="rounded-lg border border-appBorder bg-appMuted px-3 py-3">
                    <div className="flex items-center gap-1.5 text-appSubtext">
                      <FolderOpen className="h-3.5 w-3.5" />

                      <span className="text-[11px] font-semibold">
                        الإجمالي
                      </span>

                    </div>

                    <p className="mt-1 text-lg font-bold text-appText tabular-nums">
                      {total}
                    </p>
                  </div>
                </div>

                {/* Bottom */}
                <div className="mt-5 flex items-center justify-between border-t border-appBorder pt-3 text-xs text-appSubtext">
                  <span>
                    فتح ملف الشركة
                  </span>

                  <span className="text-brand opacity-0 ui-transition group-hover:opacity-100">
                    عرض العقود
                  </span>
                </div>
              </button>
            );
          })}

        </div>

      )}

    </div>
  );
}