import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  FilePenLine,
  FileText,
  Folder,
  Upload,
  ArrowRight,
} from "lucide-react";

import MainLayout from "../../../shared/layout/MainLayout";
import { fetchCompanyById } from "../../../api/companies";

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Initialize state directly from route navigation state if available
  const [company, setCompany] = useState(location.state?.company || null);
  const [loading, setLoading] = useState(!location.state?.company);

  useEffect(() => {
    // 2. Only fetch from API if user refreshed or opened URL directly
    console.log("CompanyDetailsPage useEffect triggered. Company:", company);
    if (!company) {
      const getCompany = async () => {
        try {
          const data = await fetchCompanyById(id);
          setCompany(data || null);
        } catch (err) {
          console.error("Failed to fetch company details:", err);
        } finally {
          setLoading(false);
        }
      };

      getCompany();
    }
  }, [id, company]);

  const stats = useMemo(() => {
    if (!company?.contracts) {
      return { total: 0, establishment: 0, amendment: 0, other: 0 };
    }

    let establishment = 0;
    let amendment = 0;
    let other = 0;

    company.contracts.forEach((contract) => {
      if (contract.type === "CREATING") establishment++;
      else if (contract.type === "UPDATING") amendment++;
      else if (contract.type === "OTHER") other++;
    });

    return {
      total: company.contracts.length,
      establishment,
      amendment,
      other,
    };
  }, [company]);

  if (loading) {
    return (
      <MainLayout title="جاري التحميل..." subtitle="الشركات">
        <div className="flex h-64 items-center justify-center rounded-lg border border-appBorder bg-appSurface">
          <p className="font-medium text-appSubtext">جاري تحميل بيانات الشركة...</p>
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout title="الشركة غير موجودة" subtitle="الشركات">
        <div className="rounded-lg border border-appBorder bg-appSurface p-8 text-center shadow-panel">
          <Building2 className="mx-auto h-12 w-12 text-appSubtext" />
          <h3 className="mt-4 text-lg font-bold text-appText">لم يتم العثور على الشركة</h3>
          <button
            onClick={() => navigate("/companies")}
            className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
          >
            <ArrowRight className="h-4 w-4" />
            العودة لقائمة الشركات
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      // title={company.name}
      subtitle="الشركات"
      // actions={
      //   <button
      //     type="button"
      //     onClick={() => navigate("/companies")}
      //     className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-appBorder bg-appSurface px-4 text-sm font-bold text-appText shadow-panel ui-transition hover:bg-appMuted"
      //   >
      //     <ArrowRight className="h-4 w-4" />
      //     رجوع
      //   </button>
      // }
    >
      <div className="space-y-6" dir="rtl">
        {/* Profile Card */}
        <div className="rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4 text-right">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
                <Building2 className="h-7 w-7" />
              </div>
              
              <div>
                <span className="text-xs font-semibold text-appSubtext">ملف الشركة</span>
                <h2 className="text-xl font-extrabold text-appText sm:text-2xl md:text-3xl">
                  {company.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-appSubtext">
                  {company.companyType || "شركة مساهمة المصرية"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="min-w-[80px] rounded-xl border border-badgePurpleBorder/30 bg-badgePurpleBg/50 p-3 text-center">
                <span className="block text-2xl font-black text-badgePurpleText tabular-nums">
                  {stats.amendment}
                </span>
                <span className="text-xs font-bold text-badgePurpleText/80">تعديل</span>
              </div>

              <div className="min-w-[80px] rounded-xl border border-badgeBlueBorder/30 bg-badgeBlueBg/50 p-3 text-center">
                <span className="block text-2xl font-black text-badgeBlueText tabular-nums">
                  {stats.establishment}
                </span>
                <span className="text-xs font-bold text-badgeBlueText/80">تأسيس</span>
              </div>

              <div className="min-w-[80px] rounded-xl border border-appBorder bg-appMuted p-3 text-center">
                <span className="block text-2xl font-black text-appText tabular-nums">
                  {stats.total}
                </span>
                <span className="text-xs font-bold text-appSubtext">الإجمالي</span>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            onClick={() => navigate(`/companies2/${company.id}/creating`)}
            className="group cursor-pointer rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel ui-transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-panelStrong"
          >
            <div className="flex items-start justify-between gap-3">  
              <div className="text-right">
                <h3 className="text-lg font-extrabold text-appText group-hover:text-brand">
                  عقود تأسيس
                </h3>
                <p className="mt-0.5 text-xs text-appSubtext">
                  العقود الأصلية وبينات الأساس الخاصة بالشركة.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-badgeBlueBorder/30 bg-badgeBlueBg text-badgeBlueText">
                <FileText className="h-5 w-5" />
              </div>

            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-appMuted px-4 py-2.5 text-xs font-bold">
              <span className="text-appSubtext">المتوفر</span>

              <span className="text-appText">
                {stats.establishment === 1 ? "عقد واحد" : `${stats.establishment} عقود`}
              </span>
            </div>
          </div>

          <div
            onClick={() => navigate(`/companies2/${company.id}/updating`)}
            className="group cursor-pointer rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel ui-transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-panelStrong"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-right">
                <h3 className="text-lg font-extrabold text-appText group-hover:text-brand">
                  عقود تعديل
                </h3>
                <p className="mt-0.5 text-xs text-appSubtext">
                  ملفات التعديل والتحديثات المرتبطة بعقد الشركة.
                </p>
              </div>
              
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-badgePurpleBorder/30 bg-badgePurpleBg text-badgePurpleText">
                <FilePenLine className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-appMuted px-4 py-2.5 text-xs font-bold">
              <span className="text-appSubtext">المتوفر</span>
              <span className="text-appText">
                {stats.amendment === 1 ? "عقد واحد" : `${stats.amendment} عقود`}
              </span>
            </div>
          </div>

          <div
            onClick={
              // () => navigate(`/companies/${company.id}/contracts?type=OTHER`)
              () => alert("not implemented yet")
            }
            className="group cursor-pointer rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel ui-transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-panelStrong"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-right">
                <h3 className="text-lg font-extrabold text-appText group-hover:text-brand">أخرى</h3>
                <p className="mt-0.5 text-xs text-appSubtext">
                  مستندات وملفات إضافية محفوظة ضمن ملف الشركة.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
                <Folder className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-xl bg-appMuted px-4 py-2.5 text-xs font-bold">
              <span className="text-appSubtext">المتوفر</span>

              <span className="text-appText">
                {stats.other === 1 ? "عقد واحد" : `${stats.other} عقود`}
              </span>
            </div>
          </div>
        </div>

        {/* Action Boxes */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel">
            <div className="text-right">
              <p className="text-xs text-appSubtext">سيتم حفظ الملف ضمن الشركة الحالية.</p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-badgeBlueBg px-4 py-2.5 text-xs font-bold text-badgeBlueText ui-transition hover:opacity-80"
            >
              <Upload className="h-4 w-4" />
              رفع مستند جديد
            </button>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel">
            <div className="text-right">
              <p className="text-xs text-appSubtext">إضافة عقد جديد للملف مباشرة.</p>
            </div>
            
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-badgeBlueBg px-4 py-2.5 text-xs font-bold text-badgeBlueText ui-transition hover:opacity-80"
            >
              <Upload className="h-4 w-4" />
              رفع ملف جديد
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}