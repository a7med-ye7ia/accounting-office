import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  FileText,
  Database,
  Building2,
  CalendarDays,
  MapPin,
  Banknote,
  ScrollText,
} from "lucide-react";

import MainLayout from "../../../shared/layout/MainLayout";

import { fetchCompanyById, fetchCompanyCreating } from "../../../api/companies";


export default function CreatingContract() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pdfFile, setPdfFile] = useState(null);
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("json"); // "pdf" or "json"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const company = await fetchCompanyById(id);
        const data = await fetchCompanyCreating(company.id, company.name);
        console.log("Fetched creating contract data:", data);
        const pdfBlob = new Blob([data.pdf], {
        type: "application/pdf",
        });
        setPdfFile(pdfBlob);
        setJsonData(data.json);

      } catch (error) {
        console.error("Failed to fetch creating contract:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const pdfUrl = useMemo(() => {
    if (!pdfFile) return null;

    return URL.createObjectURL(pdfFile);
  }, [pdfFile]);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (loading) {
    return (
      <MainLayout title="جاري التحميل..." subtitle="عقود التأسيس">
        <div
          dir="rtl"
          className="flex h-64 items-center justify-center rounded-2xl border border-appBorder bg-appSurface"
        >
          <p className="font-medium text-appSubtext">
            جاري تحميل بيانات عقد التأسيس...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (!pdfFile && !jsonData) {
    return (
      <MainLayout title="العقد غير موجود" subtitle="عقود التأسيس">
        <div
          dir="rtl"
          className="rounded-2xl border border-appBorder bg-appSurface p-8 text-center shadow-panel"
        >
          <FileText className="mx-auto h-12 w-12 text-appSubtext" />

          <h3 className="mt-4 text-lg font-bold text-appText">
            لم يتم العثور على عقد التأسيس
          </h3>

          <button
            onClick={() => navigate(`/companies2/${id}`)}
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
          >
            <ArrowRight className="h-4 w-4" />
            العودة إلى الشركة
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout subtitle="عقود التأسيس">
      <div dir="rtl" className="space-y-6">

        {/* Header */}
        <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
                <Building2 className="h-7 w-7" />
              </div>

              <div>
                <span className="text-xs font-semibold text-appSubtext">
                  عقد التأسيس
                </span>

                <h1 className="text-xl font-extrabold text-appText sm:text-2xl">
                  {jsonData?.company_name || "عقد تأسيس الشركة"}
                </h1>

                <p className="mt-1 text-sm text-appSubtext">
                  الشركة رقم: {id}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/companies2/${id}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-appBorder bg-appSurface px-4 py-2.5 text-sm font-bold text-appText shadow-panel ui-transition hover:bg-appMuted"
            >
              <ArrowRight className="h-4 w-4" />
              العودة إلى الشركة
            </button>

          </div>
        </div>

        {/* View selector */}
        <div className="rounded-2xl border border-appBorder bg-appSurface p-2 shadow-panel">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveView("json")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ui-transition ${
                activeView === "json"
                  ? "bg-brand text-white"
                  : "text-appSubtext hover:bg-appMuted"
              }`}
            >
              <Database className="h-5 w-5" />
              عرض البيانات
            </button>

            <button
              type="button"
              onClick={() => setActiveView("pdf")}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold ui-transition ${
                activeView === "pdf"
                  ? "bg-brand text-white"
                  : "text-appSubtext hover:bg-appMuted"
              }`}
            >
              <FileText className="h-5 w-5" />
              عرض ملف PDF
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* PDF VIEW                                              */}
        {/* ===================================================== */}

        {activeView === "pdf" && (
          <div className="overflow-hidden rounded-2xl border border-appBorder bg-appSurface shadow-panel">

            <div className="border-b border-appBorder p-5">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-brand" />

                <div>
                  <h2 className="font-extrabold text-appText">
                    ملف عقد التأسيس
                  </h2>

                  <p className="text-xs text-appSubtext">
                    عرض النسخة الأصلية من العقد
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[750px] bg-appMuted">

              {pdfUrl ? (
                <iframe
                  title="Creating Contract PDF"
                  src={pdfUrl}
                  className="h-full w-full border-0"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <FileText className="mx-auto h-12 w-12 text-appSubtext" />

                    <p className="mt-4 font-bold text-appText">
                      لم يتم تحميل ملف PDF
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* JSON VIEW                                             */}
        {/* ===================================================== */}

        {activeView === "json" && jsonData && (
          <div className="space-y-6">

            {/* Basic company information */}
            <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">

              <div className="mb-5 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-brand" />

                <h2 className="text-lg font-extrabold text-appText">
                  بيانات الشركة
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <InfoCard
                  icon={<Building2 className="h-4 w-4" />}
                  label="اسم الشركة"
                  value={jsonData.company_name}
                />

                <InfoCard
                  icon={<Building2 className="h-4 w-4" />}
                  label="نوع الشركة"
                  value={jsonData.company_type}
                />

                <InfoCard
                  icon={<MapPin className="h-4 w-4" />}
                  label="عنوان الشركة"
                  value={jsonData.company_address}
                />

                <InfoCard
                  icon={<Banknote className="h-4 w-4" />}
                  label="رأس المال"
                  value={jsonData.company_capital}
                />

                <InfoCard
                  icon={<ScrollText className="h-4 w-4" />}
                  label="رقم السجل التجاري"
                  value={jsonData.commercial_register_number}
                />

                <InfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="تاريخ الموافقة"
                  value={jsonData.approval_date}
                />

                <InfoCard
                  icon={<ScrollText className="h-4 w-4" />}
                  label="رقم محضر الشهر العقاري"
                  value={jsonData.real_estate_registry_minutes_number}
                />

                <InfoCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="مدة الشركة"
                  value={jsonData.company_duration}
                />

              </div>
            </div>

            {/* Law reference */}
            <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">

              <div className="mb-5 flex items-center gap-3">
                <ScrollText className="h-5 w-5 text-brand" />

                <h2 className="text-lg font-extrabold text-appText">
                  المرجع القانوني
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <InfoCard
                  label="رقم القانون"
                  value={jsonData.law_reference?.law_number}
                />

                <InfoCard
                  label="سنة القانون"
                  value={jsonData.law_reference?.law_year}
                />

              </div>
            </div>

            {/* Company activity */}
            <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">

              <div className="mb-4 flex items-center gap-3">
                <ScrollText className="h-5 w-5 text-brand" />

                <h2 className="text-lg font-extrabold text-appText">
                  نشاط الشركة
                </h2>
              </div>

              <p className="rounded-xl bg-appMuted p-4 text-sm leading-8 text-appText">
                {jsonData.company_activity}
              </p>

            </div>

            {/* Articles */}
            <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">

              <div className="mb-5 flex items-center gap-3">
                <FileText className="h-5 w-5 text-brand" />

                <h2 className="text-lg font-extrabold text-appText">
                  مواد العقد
                </h2>

                <span className="rounded-lg bg-appMuted px-2.5 py-1 text-xs font-bold text-appSubtext">
                  {jsonData.articles?.length || 0} مادة
                </span>
              </div>

              <div className="space-y-4">

                {jsonData.articles?.map((article, index) => (
                  <div
                    key={article.id ?? index}
                    className="rounded-xl border border-appBorder bg-appMuted p-5"
                  >

                    <div className="mb-3 flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-sm font-black text-brand">
                        {index + 1}
                      </div>

                      <h3 className="font-extrabold text-appText">
                        المادة {index + 1}
                      </h3>

                    </div>

                    <p className="text-sm leading-8 text-appText">
                      {article.value}
                    </p>

                  </div>
                ))}

              </div>

            </div>

          </div>
        )}

      </div>
    </MainLayout>
  );
}


/*
 * Small reusable component for displaying one piece of information.
 */
function InfoCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-appBorder bg-appMuted p-4">

      <div className="flex items-center gap-2 text-xs font-bold text-appSubtext">
        {icon}
        <span>{label}</span>
      </div>

      <p className="mt-2 text-sm font-bold leading-7 text-appText">
        {value || "غير متوفر"}
      </p>

    </div>
  );
}

