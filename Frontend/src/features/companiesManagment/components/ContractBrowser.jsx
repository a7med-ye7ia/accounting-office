import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { fetchCompanies } from "../../../api/companies";
import Breadcrumb from "./Breadcrumb";
import CompanyList from "./CompanyList";
import ContractViewer from "./ContractViewer";
import PdfList from "./PdfList";
import PdfViewer from "./PdfViewer";
import ChatModal from "./ChatModal";
import UploadModal from "./UploadModal";
import DeleteToast from "./DeleteToast";
import { CreateAmendmentAiPageView } from "./CreateAmendmentAiModal";

const BASE_PATH = "/ContractBrowser";

export default function ContractBrowser() {
  const navigate = useNavigate();
  const location = useLocation();
  const { companyId, type, pdfId } = useParams();

  /* ---- Navigation State from URL ---- */
  const normalizedType =
    type === "establishment" || type === "amendment" || type === "other"
      ? type
      : null;

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

  /* ---- Data State ---- */
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState(null);

  /* ---- Upload & Delete State ---- */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const [uploadZoneOnly, setUploadZoneOnly] = useState(false);
  const [extraContracts, setExtraContracts] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [deletedContract, setDeletedContract] = useState(null);

  /* ---- Article Chat State ---- */
  const [selectedArticle, setSelectedArticle] = useState(null);

  /* ---- Load Companies ---- */
  useEffect(() => {
    const loadCompanies = async () => {
      setLoadingCompanies(true);
      setCompaniesError(null);

      try {
        const data = await fetchCompanies();
        console.log("Companies data:", data);

        const transformedCompanies = data.map((company) => ({
          id: company.id,
          icon: "🏢",
          name: company.name,
          description: company.companyType,
          establishmentContracts: (company.contracts || [])
            .filter((c) => c.type === "ESTABLISHMENT")
            .map((c) => ({
              id: c.id,
              name: c.filePath || `Contract ${c.id}`,
              type: "establishment",
              date: c.createdAt,
              size: "N/A",
              company_name: c.company_name,
              company_address: c.company_address,
              company_type: c.company_type,
              law_reference: c.law_reference,
              company_capital: c.company_capital,
              commercial_register_number: c.commercial_register_number,
              approval_date: c.approval_date,
              real_estate_registry_minutes_number:
                c.real_estate_registry_minutes_number,
              company_duration: c.company_duration,
              company_activity: c.company_activity,
              articles: c.articles,
            })),
          amendmentContracts: (company.contracts || [])
            .filter((c) => c.type === "CREATING")
            .map((c) => ({
              id: c.id,
              name: c.filePath || `Contract ${c.id}`,
              type: "amendment",
              date: c.createdAt,
              size: "N/A",
            })),
          otherContracts: [],
        }));

        setCompanies(transformedCompanies || []);
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompaniesError("فشل تحميل الشركات. حاول مرة أخرى لاحقًا.");
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  /* ---- Derived Data ---- */
  const selectedCompany = useMemo(() => {
    if (!companyId) return null;
    return companies.find((company) => String(company.id) === String(companyId)) || null;
  }, [companies, companyId]);

  const getContractsForCompanyType = useCallback(
    (company, contractType) => {
      if (!company) return [];

      const base =
        contractType === "establishment"
          ? company.establishmentContracts
          : contractType === "other"
            ? company.otherContracts || []
            : company.amendmentContracts;

      const extras = extraContracts.filter(
        (c) => c.companyId === company.id && c.type === contractType
      );

      return [...base, ...extras].filter((c) => !removedIds.includes(c.id));
    },
    [extraContracts, removedIds]
  );

  const selectedContracts = useMemo(() => {
    if (!selectedCompany || !normalizedType) return [];
    return getContractsForCompanyType(selectedCompany, normalizedType);
  }, [selectedCompany, normalizedType, getContractsForCompanyType]);

  const selectedPdf = useMemo(() => {
    if (!pdfId) return null;
    return (
      selectedContracts.find((c) => String(c.id) === String(pdfId)) || null
    );
  }, [selectedContracts, pdfId]);

  const availableArticlesForAi = useMemo(() => {
    if (!selectedCompany) return [];

    return selectedCompany.establishmentContracts.flatMap((contract) =>
      (contract.articles || []).map((article, index) => ({
        id:
          article.id ||
          `${contract.id}-article-${index + 1}`,
        title: article.title || `المادة ${article.id || index + 1}`,
        subtitle: contract.name,
        content: article.content || "",
      }))
    );
  }, [selectedCompany]);

  /* ---- Invalid Route Recovery ---- */
  useEffect(() => {
    if (!loadingCompanies && companyId && !selectedCompany) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [loadingCompanies, companyId, selectedCompany, navigate]);

  useEffect(() => {
    if (
      !loadingCompanies &&
      companyId &&
      selectedCompany &&
      type &&
      !normalizedType
    ) {
      navigate(`${BASE_PATH}/company/${selectedCompany.id}`, {
        replace: true,
      });
    }
  }, [
    loadingCompanies,
    companyId,
    selectedCompany,
    type,
    normalizedType,
    navigate,
  ]);

  useEffect(() => {
    if (
      !loadingCompanies &&
      view === "pdfViewer" &&
      pdfId &&
      !selectedPdf &&
      selectedCompany &&
      normalizedType
    ) {
      navigate(
        `${BASE_PATH}/company/${selectedCompany.id}/type/${normalizedType}`,
        { replace: true }
      );
    }
  }, [
    loadingCompanies,
    view,
    pdfId,
    selectedPdf,
    selectedCompany,
    normalizedType,
    navigate,
  ]);

  useEffect(() => {
    if (loadingCompanies || !companyId) return;
    if (
      location.pathname.replace(/\/$/, "").endsWith("/Ai") &&
      normalizedType !== "amendment"
    ) {
      navigate(
        `${BASE_PATH}/company/${companyId}/type/${normalizedType || "establishment"}`,
        { replace: true }
      );
    }
  }, [loadingCompanies, companyId, location.pathname, normalizedType, navigate]);

  useEffect(() => {
    if (view === "companies") {
      setShowUploadModal(false);
      setUploadType(null);
      setUploadZoneOnly(false);
      setSelectedArticle(null);
    }
  }, [view]);

  useEffect(() => {
    if (view !== "pdfViewer") {
      setSelectedArticle(null);
    }
  }, [view]);

  /* ======== NAVIGATION HELPERS ======== */
  const handleSelectCompany = (company) => {
    navigate(`${BASE_PATH}/company/${company.id}`);
  };

  const handleSelectType = (contractType) => {
    if (!selectedCompany) return;

    if (contractType === "other") {
      navigate(`${BASE_PATH}/company/${selectedCompany.id}/type/other`);
      return;
    }

    const contracts = getContractsForCompanyType(selectedCompany, contractType);

    if (contractType === "establishment" && contracts.length === 0) {
      setUploadZoneOnly(false);
      setUploadType(contractType);
      setShowUploadModal(true);
      return;
    }

    navigate(`${BASE_PATH}/company/${selectedCompany.id}/type/${contractType}`);
  };

  const handleSelectPdf = (pdf) => {
    if (!selectedCompany || !normalizedType) return;

    navigate(
      `${BASE_PATH}/company/${selectedCompany.id}/type/${normalizedType}/pdf/${pdf.id}`
    );
  };

  const handleSelectArticle = (article) => {
    console.log("📄 Selected Article:", article.title);
    console.log("📝 Content:", article.content);
    setSelectedArticle(article);
  };

  /* ======== UPLOAD HANDLER ======== */
  const handleUpload = (newContract) => {
    if (!selectedCompany) return;

    console.log("✅ Uploaded:", newContract.name, "| Type:", newContract.type);

    setExtraContracts((prev) => [
      { ...newContract, companyId: selectedCompany.id },
      ...prev,
    ]);

    setUploadType(null);
    setShowUploadModal(false);
    setUploadZoneOnly(false);

    navigate(
      `${BASE_PATH}/company/${selectedCompany.id}/type/${newContract.type}`
    );
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

  /* ======== AI AMENDMENT (full page route) ======== */
  const handleCreateAiContract = () => {
    if (!selectedCompany) return;
    navigate(
      `${BASE_PATH}/company/${selectedCompany.id}/type/amendment/Ai`
    );
  };

  const handleGenerateAiAmendment = (payload) => {
    console.log("🤖 AI amendment request:", payload);
    if (selectedCompany) {
      navigate(
        `${BASE_PATH}/company/${selectedCompany.id}/type/amendment`
      );
    }
  };

  /* ======== EDIT HANDLER ======== */
  const handleEdit = (contract) => {
    console.log("✏️ Edit contract:", contract.name);
    console.log("📄 Contract data:", contract);
  };

  /* ======== DELETE HANDLER ======== */
  const handleDelete = (contract) => {
    console.log("🗑️ Soft delete:", contract.name);
    setRemovedIds((prev) => [...prev, contract.id]);
    setDeletedContract(contract);
  };

  /* ======== UNDO HANDLER ======== */
  const handleUndo = useCallback((contract) => {
    console.log("↩️ Undo delete:", contract.name);
    setRemovedIds((prev) => prev.filter((id) => id !== contract.id));
    setDeletedContract(null);
  }, []);

  /* ======== EXPIRE HANDLER ======== */
  const handleExpire = useCallback(() => {
    setDeletedContract((prev) => {
      if (prev) {
        console.log("💀 Permanently deleted:", prev.name);
        setExtraContracts((contracts) =>
          contracts.filter((c) => c.id !== prev.id)
        );
      }
      return null;
    });
  }, []);

  /* ======== BREADCRUMBS ======== */
  const buildBreadcrumbs = () => {
    const items = [
      { label: "🏠 الرئيسية", action: () => navigate(BASE_PATH) },
    ];

    if (selectedCompany && view !== "companies") {
      items.push({
        label: `🏢 ${selectedCompany.name}`,
        action: () => navigate(`${BASE_PATH}/company/${selectedCompany.id}`),
      });
    }

    if (
      selectedCompany &&
      normalizedType &&
      (view === "pdfList" || view === "pdfViewer" || view === "amendmentAi")
    ) {
      items.push({
        label:
          normalizedType === "establishment"
            ? "📋 عقود تأسيس"
            : normalizedType === "amendment"
              ? "📝 عقود تعديل"
              : "📁 أخرى",
        action: () =>
          navigate(
            `${BASE_PATH}/company/${selectedCompany.id}/type/${normalizedType}`
          ),
      });
    }

    if (view === "amendmentAi") {
      items.push({ label: "✨ إنشاء تعديل بالذكاء الاصطناعي" });
    }

    if (selectedPdf && view === "pdfViewer") {
      items.push({ label: `📄 ${selectedPdf.name}` });
    }

    return items;
  };

  /* ======== RENDER ======== */
  return (
    <div className="w-full" dir="rtl">
      {view !== "companies" && (
        <Breadcrumb
          items={buildBreadcrumbs()}
          type={normalizedType}
        />
      )}

        {view === "companies" && (
          <>
            {loadingCompanies ? (
              <div className="text-center py-20 text-appSubtext">جاري تحميل الشركات...</div>
            ) : companiesError ? (
              <div className="text-center py-20 text-danger font-medium">{companiesError}</div>
            ) : (
              <CompanyList
                companies={companies}
                onSelectCompany={handleSelectCompany}
              />
            )}
          </>
        )}

        {view === "contractTypes" && selectedCompany && (
          <ContractViewer
            company={selectedCompany}
            onSelectType={handleSelectType}
            onUploadClick={openUploadZoneOnlyOther}
          />
        )}

        {view === "pdfList" && selectedCompany && normalizedType && (
          <PdfList
            contracts={selectedContracts}
            contractType={normalizedType}
            company={selectedCompany}
            onSelectPdf={handleSelectPdf}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onUploadClick={() => openUploadForType(normalizedType)}
            onCreateAiClick={handleCreateAiContract}
          />
        )}

        {view === "pdfViewer" &&
          selectedPdf &&
          selectedCompany &&
          normalizedType && (
            <PdfViewer
              pdf={selectedPdf}
              company={selectedCompany}
              onSelectArticle={handleSelectArticle}
            />
          )}

        {view === "amendmentAi" && selectedCompany && (
          <CreateAmendmentAiPageView
            company={selectedCompany}
            availableArticles={availableArticlesForAi}
            onBack={() =>
              navigate(
                `${BASE_PATH}/company/${selectedCompany.id}/type/amendment`
              )
            }
            onSubmit={handleGenerateAiAmendment}
          />
        )}

      {selectedArticle && (
        <ChatModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={() => {
            setShowUploadModal(false);
            setUploadType(null);
            setUploadZoneOnly(false);
          }}
          onUpload={handleUpload}
          initialType={uploadType}
          uploadZoneOnly={uploadZoneOnly}
        />
      )}

      {deletedContract && (
        <DeleteToast
          key={deletedContract.id}
          contract={deletedContract}
          onUndo={handleUndo}
          onExpire={handleExpire}
        />
      )}
    </div>
  );
}