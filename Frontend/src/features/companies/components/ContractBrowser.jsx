import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, RefreshCw } from "lucide-react";
import apiClient from "../../../api/client";
import { deleteContract } from "../../../api/contracts";
import AddCompanyModal from "./AddCompanyModal";
import Breadcrumb from "./Breadcrumb";
import ChatModal from "./ChatModal";
import CompanyList from "./CompanyList";
import ContractViewer from "./ContractViewer";
import PdfList from "./PdfList";
import PdfViewer from "./PdfViewer";
import UploadModal from "./UploadModal";
import { CreateAmendmentAiPageView } from "./CreateAmendmentAiModal";
import { saveAmendmentContract } from "./createAmendmentAi/amendmentPdfUtils";
import {
  getContractTypeMeta,
  getContractsByType,
  isKnownContractType,
  useCompaniesWorkflowData,
} from "../services/companyWorkflow";


function CompaniesLoadingSkeleton() {
  return (
    <div className="animate-fadeIn space-y-6" dir="rtl" aria-label="جاري تحميل الشركات">
      <div className="rounded-lg border border-appBorder bg-appSurface p-6 shadow-panel">
        <div className="h-4 w-28 rounded bg-appMuted" />
        <div className="mt-3 h-8 w-64 max-w-full rounded bg-appMuted" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-appMuted" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
            <div className="h-10 w-10 rounded-lg bg-appMuted" />
            <div className="mt-4 h-6 w-16 rounded bg-appMuted" />
            <div className="mt-2 h-3 w-20 rounded bg-appMuted" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="min-h-[188px] rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel">
            <div className="flex justify-between gap-4">
              <div className="w-full space-y-3">
                <div className="h-6 w-32 rounded bg-appMuted" />
                <div className="h-5 w-48 max-w-full rounded bg-appMuted" />
              </div>
              <div className="h-12 w-12 rounded-lg bg-appMuted" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="h-16 rounded-lg bg-appMuted" />
              <div className="h-16 rounded-lg bg-appMuted" />
              <div className="h-16 rounded-lg bg-appMuted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompaniesErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-danger/30 bg-appSurface p-8 text-center shadow-panel" dir="rtl">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-danger/25 bg-danger/10 text-danger">
        <AlertCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-appText">تعذر تحميل الشركات</h3>
      <p className="mt-2 text-sm leading-6 text-appSubtext">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white ui-transition hover:bg-brandDeep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        إعادة المحاولة
      </button>
    </div>
  );
}

function useCompaniesRoute(basePath) {
  const location = useLocation();
  const { companyId, type, pdfId } = useParams();
  const normalizedType = isKnownContractType(type) ? type : null;
  const isAmendmentAiPage =
    Boolean(companyId) &&
    normalizedType === "amendment" &&
    location.pathname.replace(/\/$/, "").endsWith("/Ai");

  const view = !companyId
    ? "companies"
    : !normalizedType
      ? "contractTypes"
      : isAmendmentAiPage
        ? "amendmentAi"
        : !pdfId
          ? "pdfList"
          : "pdfViewer";

  return {
    basePath,
    companyId,
    location,
    normalizedType,
    pdfId,
    type,
    view,
  };
}

export default function ContractBrowser({ basePath = "/companies" }) {
  const navigate = useNavigate();
  const route = useCompaniesRoute(basePath);
  const { companies, loading, error, reload } = useCompaniesWorkflowData();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [uploadZoneOnly, setUploadZoneOnly] = useState(false);
  const [actionError, setActionError] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  const selectedCompany = useMemo(() => {
    if (!route.companyId) return null;
    return companies.find((company) => String(company.id) === String(route.companyId)) || null;
  }, [companies, route.companyId]);

  const getVisibleContracts = useCallback((company, contractType) => getContractsByType(company, contractType), []);

  const selectedContracts = useMemo(() => {
    if (!selectedCompany || !route.normalizedType) return [];
    return getVisibleContracts(selectedCompany, route.normalizedType);
  }, [getVisibleContracts, route.normalizedType, selectedCompany]);

  const selectedPdf = useMemo(() => {
    if (!route.pdfId) return null;
    return selectedContracts.find((contract) => String(contract.id) === String(route.pdfId)) || null;
  }, [route.pdfId, selectedContracts]);

  const availableArticlesForAi = useMemo(() => {
    if (!selectedCompany) return [];

    return selectedCompany.establishmentContracts.flatMap((contract) =>
      (contract.articles || []).map((article, index) => ({
        id: article.id || `${contract.id}-article-${index + 1}`,
        title: article.title || `المادة ${article.id || index + 1}`,
        subtitle: contract.name,
        content: article.content || article.value || "",
      }))
    );
  }, [selectedCompany]);

  useEffect(() => {
    if (!loading && route.companyId && !selectedCompany) {
      navigate(route.basePath, { replace: true });
    }
  }, [loading, navigate, route.basePath, route.companyId, selectedCompany]);

  useEffect(() => {
    if (!loading && route.companyId && selectedCompany && route.type && !route.normalizedType) {
      navigate(`${route.basePath}/company/${selectedCompany.id}`, { replace: true });
    }
  }, [loading, navigate, route.basePath, route.companyId, route.normalizedType, route.type, selectedCompany]);

  useEffect(() => {
    if (!loading && route.view === "pdfViewer" && route.pdfId && !selectedPdf && selectedCompany && route.normalizedType) {
      navigate(`${route.basePath}/company/${selectedCompany.id}/type/${route.normalizedType}`, { replace: true });
    }
  }, [loading, navigate, route.basePath, route.normalizedType, route.pdfId, route.view, selectedCompany, selectedPdf]);

  useEffect(() => {
    if (loading || !route.companyId) return;
    if (route.location.pathname.replace(/\/$/, "").endsWith("/Ai") && route.normalizedType !== "amendment") {
      navigate(`${route.basePath}/company/${route.companyId}/type/${route.normalizedType || "establishment"}`, { replace: true });
    }
  }, [loading, navigate, route.basePath, route.companyId, route.location.pathname, route.normalizedType]);


  const handleSelectCompany = (company) => {
    navigate(`${route.basePath}/company/${company.id}`);
  };

  const handleSelectType = (contractType) => {
    if (!selectedCompany) return;

    if (contractType === "other") {
      navigate(`${route.basePath}/company/${selectedCompany.id}/type/other`);
      return;
    }

    const contracts = getVisibleContracts(selectedCompany, contractType);
    if (contractType === "establishment" && contracts.length === 0) {
      setUploadZoneOnly(false);
      setUploadType(contractType);
      setShowUploadModal(true);
      return;
    }

    navigate(`${route.basePath}/company/${selectedCompany.id}/type/${contractType}`);
  };

  const handleSelectPdf = (pdf) => {
    if (!selectedCompany || !route.normalizedType) return;
    navigate(`${route.basePath}/company/${selectedCompany.id}/type/${route.normalizedType}/pdf/${pdf.id}`);
  };

  const handleUpload = async (newContract) => {
    if (!selectedCompany) return;

    setActionError("");
    setUploadType(null);
    setShowUploadModal(false);
    setUploadZoneOnly(false);
    await reload();
    navigate(`${route.basePath}/company/${selectedCompany.id}/type/${newContract.type}`);
  };

  const openUploadForType = (contractType) => {
    setUploadZoneOnly(false);
    setUploadType(contractType);
    setShowUploadModal(true);
  };

  const openUploadZoneOnlyOther = () => {
    setUploadZoneOnly(true);
    setUploadType("other");
    setShowUploadModal(true);
  };

  const handleCreateAiContract = () => {
    if (!selectedCompany) return;
    navigate(`${route.basePath}/company/${selectedCompany.id}/type/amendment/Ai`);
  };

  const handleGenerateAiAmendment = async (payload) => {
    try {
      setActionError("");
      await saveAmendmentContract(selectedCompany.id, payload.company, payload.sections);
      await reload();

      const sections = (payload.sections || []).map((section) => ({
        selectedArticleTitle: section.selectedArticleTitle || "",
        beforeText: section.beforeText || "",
        afterText: section.afterText || "",
      }));

      await apiClient.post("/activity-logs/amendment", {
        companyId: selectedCompany?.id,
        companyName: selectedCompany?.name,
        sections,
      });
    } catch (error) {
      console.error("Failed to generate and save amendment contract:", error);
      setActionError("فشل إنشاء عقد التعديل وحفظه. حاول مرة أخرى.");
    }

    if (selectedCompany) {
      navigate(`${route.basePath}/company/${selectedCompany.id}/type/amendment`);
    }
  };

  const handleDelete = async (contract) => {
    if (!contract?.id) return;

    setActionError("");
    try {
      await deleteContract(contract.id);
      await reload();
      if (route.view === "pdfViewer" && selectedCompany && route.normalizedType) {
        navigate(`${route.basePath}/company/${selectedCompany.id}/type/${route.normalizedType}`);
      }
    } catch (deleteError) {
      console.error("Failed to delete contract:", deleteError);
      setActionError("فشل حذف العقد. حاول مرة أخرى.");
    }
  };

  const breadcrumbs = useMemo(() => {
    const items = [{ label: "الرئيسية", action: () => navigate(route.basePath) }];

    if (selectedCompany && route.view !== "companies") {
      items.push({
        label: selectedCompany.name,
        action: () => navigate(`${route.basePath}/company/${selectedCompany.id}`),
      });
    }

    if (selectedCompany && route.normalizedType && ["pdfList", "pdfViewer", "amendmentAi"].includes(route.view)) {
      items.push({
        label: getContractTypeMeta(route.normalizedType).label,
        action: () => navigate(`${route.basePath}/company/${selectedCompany.id}/type/${route.normalizedType}`),
      });
    }

    if (route.view === "amendmentAi") {
      items.push({ label: "إنشاء تعديل بالذكاء الاصطناعي" });
    }

    if (selectedPdf && route.view === "pdfViewer") {
      items.push({ label: selectedPdf.name });
    }

    return items;
  }, [navigate, route.basePath, route.normalizedType, route.view, selectedCompany, selectedPdf]);

  return (
    <div className="w-full" dir="rtl">
      {actionError && (
        <div className="mb-4 rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm font-bold text-danger">
          {actionError}
        </div>
      )}
      {route.view !== "companies" && <Breadcrumb items={breadcrumbs} type={route.normalizedType} />}

      {route.view === "companies" && (
        <>
          {loading ? (
            <CompaniesLoadingSkeleton />
          ) : error ? (
            <CompaniesErrorState message={error} onRetry={reload} />
          ) : (
            <CompanyList
              companies={companies}
              onSelectCompany={handleSelectCompany}
              onAddCompany={() => setShowAddCompanyModal(true)}
            />
          )}
        </>
      )}

      {route.view === "contractTypes" && selectedCompany && (
        <ContractViewer
          company={selectedCompany}
          onSelectType={handleSelectType}
          onUploadClick={openUploadZoneOnlyOther}
        />
      )}

      {route.view === "pdfList" && selectedCompany && route.normalizedType && (
        <PdfList
          contracts={selectedContracts}
          contractType={route.normalizedType}
          company={selectedCompany}
          onSelectPdf={handleSelectPdf}
          onDelete={handleDelete}
          onEdit={handleSelectPdf}
          onUploadClick={() => openUploadForType(route.normalizedType)}
          onCreateAiClick={handleCreateAiContract}
        />
      )}

      {route.view === "pdfViewer" && selectedPdf && selectedCompany && route.normalizedType && (
        <PdfViewer pdf={selectedPdf} company={selectedCompany} onSelectArticle={setSelectedArticle} />
      )}

      {route.view === "amendmentAi" && selectedCompany && (
        <CreateAmendmentAiPageView
          company={selectedCompany}
          availableArticles={availableArticlesForAi}
          onBack={() => navigate(`${route.basePath}/company/${selectedCompany.id}/type/amendment`)}
          onSubmit={handleGenerateAiAmendment}
        />
      )}

      {route.view === "pdfViewer" && selectedArticle && (
        <ChatModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => {
            setShowUploadModal(false);
            setUploadType(null);
            setUploadZoneOnly(false);
          }}
          companyId={selectedCompany?.id}
          onUpload={handleUpload}
          initialType={uploadType}
          uploadZoneOnly={uploadZoneOnly}
        />
      )}

      {showAddCompanyModal && (
        <AddCompanyModal
          onClose={() => setShowAddCompanyModal(false)}
          onCompanyCreated={() => {
            setShowAddCompanyModal(false);
            reload();
          }}
        />
      )}
    </div>
  );
}


