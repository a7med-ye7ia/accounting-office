import { useState, useCallback } from "react";
import { mockCompanies } from "../../data/mockData";
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
      className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50"
      dir="rtl"
    >
      <Header showBack={view !== "companies"} onBack={handleBack} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view !== "companies" && <Breadcrumb items={buildBreadcrumbs()} type={selectedContractType} />}

        {view === "companies" && (
          <CompanyList
            companies={mockCompanies}
            onSelectCompany={handleSelectCompany}
          />
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