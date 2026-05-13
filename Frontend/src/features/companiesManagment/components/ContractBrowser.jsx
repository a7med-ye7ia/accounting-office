import { useState, useEffect, useCallback } from "react";
import { fetchCompanies } from "../../../api/companies";
import Header from "./Header";
import Breadcrumb from "./Breadcrumb";
import CompanyList from "./CompanyList";
import ContractViewer from "./ContractViewer";
import PdfList from "./PdfList";
import PdfViewer from "./PdfViewer";
import ChatModal from "./ChatModal";
import UploadModal from "./UploadModal";
import DeleteToast from "./DeleteToast";

export default function ContractBrowser() {
  /* ---- Navigation State ---- */
  const [view, setView] = useState("companies");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedContractType, setSelectedContractType] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  /* ---- Upload & Delete State ---- */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [extraContracts, setExtraContracts] = useState([]);
  const [removedIds, setRemovedIds] = useState([]);
  const [deletedContract, setDeletedContract] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState(null);

  /* ======== NAVIGATION ======== */
  const navigateTo = (target) => {
    switch (target) {
      case "companies":
        setView("companies");
        setSelectedCompany(null);
        setSelectedContractType(null);
        setSelectedPdf(null);
        break;
      case "contractTypes":
        setView("contractTypes");
        setSelectedContractType(null);
        setSelectedPdf(null);
        break;
      case "pdfList":
        setView("pdfList");
        setSelectedPdf(null);
        break;
      default:
        break;
    }
  };

  const handleBack = () => {
    if (view === "pdfViewer") navigateTo("pdfList");
    else if (view === "pdfList") navigateTo("contractTypes");
    else if (view === "contractTypes") navigateTo("companies");
  };

  useEffect(() => {
    const loadCompanies = async () => {
      setLoadingCompanies(true);
      setCompaniesError(null);

      try {
        const data = await fetchCompanies();
        console.log("Companies data:", data);
        // Transform backend company data to match frontend expectations
        const transformedCompanies = data.map(company => ({
          id: company.id,
          icon: "🏢", // Static icon for all companies
          name: company.name,
          description: company.companyType, // Use companyType as description
          establishmentContracts: company.contracts
            .filter(c => c.type === 'ESTABLISHMENT')
            .map(c => ({
              id: c.id,
              name: c.filePath || `Contract ${c.id}`, // Use filePath or fallback
              type: 'establishment',
              date: c.createdAt,
              size: 'N/A', // Placeholder, can be calculated later
              // For establishment contracts, include the structured data
              company_name: c.company_name,
              company_address: c.company_address,
              company_type: c.company_type,
              law_reference: c.law_reference,
              company_capital: c.company_capital,
              commercial_register_number: c.commercial_register_number,
              approval_date: c.approval_date,
              real_estate_registry_minutes_number: c.real_estate_registry_minutes_number,
              company_duration: c.company_duration,
              company_activity: c.company_activity,
              articles: c.articles
            })),
          amendmentContracts: company.contracts
            .filter(c => c.type === 'CREATING')
            .map(c => ({
              id: c.id,
              name: c.filePath || `Contract ${c.id}`,
              type: 'amendment',
              date: c.createdAt,
              size: 'N/A'
            }))
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

  /* ======== SELECTION HANDLERS ======== */
  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setView("contractTypes");
  };

  const handleSelectType = (type) => {
    setSelectedContractType(type);
    setView("pdfList");
  };

  const handleSelectPdf = (pdf) => {
    setSelectedPdf(pdf);
    setView("pdfViewer");
  };

  const handleSelectArticle = (article) => {
    console.log("📄 Selected Article:", article.title);
    console.log("📝 Content:", article.content);
    setSelectedArticle(article);
  };

  /* ======== UPLOAD HANDLER ======== */
  const handleUpload = (newContract) => {
    console.log("✅ Uploaded:", newContract.name, "| Type:", newContract.type);
    setExtraContracts((prev) => [
      { ...newContract, companyId: selectedCompany.id },
      ...prev,
    ]);
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

  /* ======== GET CONTRACTS (merge mock + uploaded, filter deleted) ======== */
  const getContracts = () => {
    if (!selectedCompany || !selectedContractType) return [];

    const base =
      selectedContractType === "establishment"
        ? selectedCompany.establishmentContracts
        : selectedCompany.amendmentContracts;

    const extras = extraContracts.filter(
      (c) =>
        c.companyId === selectedCompany.id &&
        c.type === selectedContractType
    );

    return [...base, ...extras].filter((c) => !removedIds.includes(c.id));
  };

  /* ======== BREADCRUMBS ======== */
  const buildBreadcrumbs = () => {
    const items = [
      { label: "🏠 الرئيسية", action: () => navigateTo("companies") },
    ];

    if (selectedCompany && view !== "companies") {
      items.push({
        label: `🏢 ${selectedCompany.name}`,
        action: () => navigateTo("contractTypes"),
      });
    }

    if (selectedContractType && (view === "pdfList" || view === "pdfViewer")) {
      items.push({
        label: selectedContractType === "establishment" ? "📋 عقود تأسيس" : "📝 عقود تعديل",
        action: () => navigateTo("pdfList"),
      });
    }

    if (selectedPdf && view === "pdfViewer") {
      items.push({ label: `📄 ${selectedPdf.name}` });
    }

    return items;
};

  /* ======== RENDER ======== */
  return (
    <div
      className="flex h-screen max-h-[100dvh] min-h-0 flex-col overflow-hidden bg-appBg text-appText"
      dir="rtl"
    >
      <Header showBack={view !== "companies"} onBack={handleBack} />

      <main className="mx-auto max-w-7xl min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto scroll-smooth px-4 py-8 sm:px-6 lg:px-8">
        {view !== "companies" && <Breadcrumb items={buildBreadcrumbs()} type={selectedContractType} />}

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
            onUploadClick={() => setShowUploadModal(true)}
          />
        )}

        {view === "pdfList" && selectedCompany && (
          <PdfList
            contracts={getContracts()}
            contractType={selectedContractType}
            company={selectedCompany}
            onSelectPdf={handleSelectPdf}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}

        {view === "pdfViewer" && selectedPdf && selectedCompany && (
          <PdfViewer
            pdf={selectedPdf}
            company={selectedCompany}
            onSelectArticle={handleSelectArticle}
          />
        )}
      </main>

      {/* Chat Modal */}
      {selectedArticle && (
        <ChatModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
        />
      )}

      {/* Delete Toast */}
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