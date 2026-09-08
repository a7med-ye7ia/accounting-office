import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  FilePenLine,
  FileText,
  User,
} from "lucide-react";

import MainLayout from "../../../shared/layout/MainLayout";

import { getUpdatingContractByCompanyId } from "../../../api/contracts";
import FinalContractReview from "./FinalContractReview";
import { getFileFromPath } from "../../../api/files";

// TODO: You may need this if you want to fetch the company separately.
// import { fetchCompanyById } from "../../../api/companies";

export default function UpdatingContract() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showContractReview, setShowContractReview] = useState(false);

  useEffect(() => {
    const loadContracts = async () => {
      try {
        setLoading(true);
        const data = await getUpdatingContractByCompanyId(id);
        setContracts(data || []);
        console.log("Updating contracts:", data);
      } catch (error) {
        console.error("Failed to fetch updating contracts:", error);
        // TODO: Add proper error state/toast if your project has one.
        setContracts([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadContracts();
    }
  }, [id]);

  /*
   * The backend may return all contract types.
   *
   * We only want contracts where:
   *
   * type === "UPDATING"
   *
   * Example:
   * {
   *   id: 90,
   *   type: "UPDATING",
   *   status: "APPROVED",
   *   ...
   * }
   */
  const updatingContracts = contracts.filter(
    (contract) => contract.type === "UPDATING"
  );

  /*
   * Navigate to the future AI contract creation page.
   *
   * TODO:
   * Change this route when we create the actual AI creation component.
   *
   * For example, later it could be:
   *
   * /companies2/:companyId/updating/new
   */
  const handleCreateContract = () => {
    navigate(`/companies2/${id}/updating/new`);
  };

  const handleViewContract = async (contract) => {
    const file = await getFileFromPath(contract.filePath);
    const text = await file.text();
    const jsonObject = JSON.parse(text);
    setSelectedContract(jsonObject);
    setShowContractReview(true);
  }

  const formatDate = (date) => {
    if (!date) return "غير محدد";

    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getContractTitle = (contract) => {
    /*
     * Your OCR JSON is currently stored as a STRING.
     *
     * Example:
     *
     * contract.ocrData =
     * '{"contractTitle":"عقد تعديل المادة 2", ...}'
     *
     * So we parse it here only to get the title.
     */

    try {
      if (!contract.filePath) {
        return `عقد تعديل رقم ${contract.id}`;
      }

      const path = contract.filePath;
      const fileName = path.split("/").pop(); // Get the last part of the path
      // const fileNameFilltered = fileName.replace(".pdf", ".json");
      return fileName.split(".")[0] || `عقد تعديل رقم ${contract.id}`;
    } catch (error) {
      console.error("Failed to parse contract OCR data:", error);

      return `عقد تعديل رقم ${contract.id}`;
    }
  };

  const getModifiedArticles = (contract) => {
    try {
      if (!contract.ocrData) {
        return [];
      }

      const ocr = JSON.parse(contract.ocrData);

      /*
       * Based on your current OCR structure:
       *
       * sections: [
       *   {
       *     selectedArticleId: "2",
       *     selectedArticleTitle: "المادة 2",
       *     beforeText: "...",
       *     afterText: "..."
       *   }
       * ]
       */

      return ocr.sections || [];
    } catch (error) {
      console.error("Failed to parse contract OCR data:", error);
      return [];
    }
  };

  if (loading) {
    return (
      <MainLayout title="عقود التعديل" subtitle="الشركات">
        <div
          dir="rtl"
          className="flex h-64 items-center justify-center rounded-2xl border border-appBorder bg-appSurface shadow-panel"
        >
          <p className="font-medium text-appSubtext">
            جاري تحميل عقود التعديل...
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
    <MainLayout title="عقود التعديل" subtitle="الشركات">
      <div dir="rtl" className="space-y-6">

        {/* ============================================================
            HEADER
        ============================================================ */}
        <div className="flex flex-col gap-4 rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-badgePurpleBorder/30 bg-badgePurpleBg text-badgePurpleText">
                <FilePenLine className="h-6 w-6" />
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-appText sm:text-2xl">
                  عقود التعديل
                </h1>

                <p className="mt-1 text-sm font-medium text-appSubtext">
                  جميع عقود التعديل المرتبطة بالشركة
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateContract}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-panel ui-transition hover:opacity-90"
          >
            <Bot className="h-5 w-5" />
            إنشاء عقد تعديل بالذكاء الاصطناعي
          </button>
        </div>

        {/* ============================================================
            BACK BUTTON
        ============================================================ */}
        <button
          type="button"
          onClick={() => navigate(`/companies2/${companyId}`)}
          className="inline-flex items-center gap-2 text-sm font-bold text-appSubtext ui-transition hover:text-brand"
        >
          <ArrowRight className="h-4 w-4" />
          العودة إلى ملف الشركة
        </button>

        {/* ============================================================
            EMPTY STATE
        ============================================================ */}
        {updatingContracts.length === 0 && (
          <div className="rounded-2xl border border-appBorder bg-appSurface p-10 text-center shadow-panel">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-appMuted text-appSubtext">
              <FilePenLine className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-lg font-extrabold text-appText">
              لا توجد عقود تعديل
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-appSubtext">
              لم يتم إنشاء أي عقد تعديل لهذه الشركة حتى الآن.
              يمكنك إنشاء عقد تعديل جديد باستخدام الذكاء الاصطناعي.
            </p>

            <button
              type="button"
              onClick={handleCreateContract}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white ui-transition hover:opacity-90"
            >
              <Bot className="h-5 w-5" />
              إنشاء عقد تعديل
            </button>
          </div>
        )}
        
        {/* ============================================================
            CONTRACTS LIST
        ============================================================ */}
        {updatingContracts.length > 0 && (
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-appText">
                العقود
              </h2>

              <span className="rounded-lg bg-appMuted px-3 py-1.5 text-xs font-bold text-appSubtext">
                {updatingContracts.length} عقود تعديل
              </span>
            </div>

            {/* Compact contract cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {updatingContracts.map((contract) => {
                const sections = getModifiedArticles(contract);

                return (
                  <div
                    key={contract.id}
                    className="group flex min-h-[250px] flex-col rounded-2xl border border-appBorder bg-appSurface p-5 shadow-panel ui-transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-panelStrong"
                  >

                    {/* ====================================================
                        CARD HEADER
                    ==================================================== */}
                    <div className="flex items-start justify-between gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-badgePurpleBorder/30 bg-badgePurpleBg text-badgePurpleText">
                        <FilePenLine className="h-5 w-5" />
                      </div>

                      <span className="rounded-lg bg-badgeBlueBg px-2.5 py-1 text-[11px] font-bold text-badgeBlueText">
                        {contract.status === "APPROVED"
                          ? "معتمد"
                          : contract.status || "غير محدد"}
                      </span>

                    </div>

                    {/* ====================================================
                        TITLE
                    ==================================================== */}
                    <div className="mt-4">

                      <p className="text-[11px] font-semibold text-appSubtext">
                        عقد رقم #{contract.id}
                      </p>

                      <h3 className="mt-1 line-clamp-2 text-base font-extrabold leading-6 text-appText group-hover:text-brand">
                        {getContractTitle(contract)}
                      </h3>

                    </div>

                    {/* ====================================================
                        CONTRACT INFO
                    ==================================================== */}
                    <div className="mt-4 space-y-2">

                      {/* Modified articles */}
                      {/* <div className="flex items-center justify-between rounded-lg bg-appMuted px-3 py-2">
                        <span className="text-[11px] font-bold text-appSubtext">
                          المواد المعدلة
                        </span>

                        <span className="text-xs font-bold text-appText">
                          {sections.length > 0
                            ? `${sections.length} مادة`
                            : "غير محدد"}
                        </span>
                      </div> */}

                      {/* Date */}
                      <div className="flex items-center justify-between rounded-lg bg-appMuted px-3 py-2">
                        <span className="text-[11px] font-bold text-appSubtext">
                          تاريخ الإنشاء
                        </span>

                        <span className="text-xs font-bold text-appText">
                          {formatDate(contract.createdAt)}
                        </span>
                      </div>

                    </div>

                    {/* // TODO: check this */}
                    {/* ====================================================
                        ARTICLE TAGS
                    ==================================================== */}
                    {/* {sections.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">

                        {sections.slice(0, 3).map((section, index) => (
                          <span
                            key={section.id || index}
                            className="rounded-md border border-appBorder bg-appSurface px-2 py-1 text-[10px] font-bold text-appSubtext"
                          >
                            {section.selectedArticleTitle ||
                              `المادة ${section.selectedArticleId}`}
                          </span>
                        ))}

                        {sections.length > 3 && (
                          <span className="rounded-md bg-appMuted px-2 py-1 text-[10px] font-bold text-appSubtext">
                            +{sections.length - 3}
                          </span>
                        )}

                      </div>
                    )} */}

                    {/* ====================================================
                        CARD ACTIONS
                    ==================================================== */}
                    <div className="mt-auto pt-4">

                      {contract.filePath && (
                        <button
                          type="button"
                          onClick={() => {
                            handleViewContract(contract);
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-appMuted px-3 py-2.5 text-xs font-bold text-appText ui-transition hover:bg-brand/10 hover:text-brand"
                        >
                          <FileText className="h-4 w-4" />
                          عرض العقد
                        </button>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>
          </div>
        )}



      </div>
    </MainLayout>

    {showContractReview && selectedContract && (
      <FinalContractReview
        open={showContractReview}
        data={selectedContract}
        readOnly={true}
        onClose={() => {
          setShowContractReview(false);
          setSelectedContract(null);
        }}
      />
    )}

    </>
  );
}
