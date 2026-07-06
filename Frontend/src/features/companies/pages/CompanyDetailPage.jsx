import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Folder,
  ChevronDown,
  ChevronRight,
  Eye,
  AlertCircle,
  X,
} from "lucide-react";
import MainLayout from "../../../shared/layout/MainLayout";
import { fetchCompanyById } from "../../../api/companies";
import apiClient from "../../../api/client";
import { createOtherContractFolder, uploadOtherContractFile } from "../../../api/files";
import { getApiErrorMessage } from "../../../utils/apiError";
import { formatDateTimeShort } from "../../../utils/dashboardFormat";

// Simple file tree component with expand/collapse
function FileTreeNode({ node, depth = 0, expanded = false, expandedFolders = {}, onToggle, onOpenFile, onSelectFolder, selectedPath }) {
  const isFolder = node.type === "folder";
  const hasChildren = isFolder && node.children?.length > 0;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 rounded-xl border border-appBorder bg-appMuted/60 px-3 py-2 text-sm"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="inline-flex shrink-0 text-appSubtext hover:text-appText"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {isFolder ? (
          <Folder className="h-4 w-4 text-brand" />
        ) : (
          <FileText className="h-4 w-4 text-appSubtext" />
        )}

        {isFolder ? (
          <button
            type="button"
            onClick={() => onSelectFolder?.(node.path)}
            className={`grow truncate text-left text-appText ${selectedPath === node.path ? "font-semibold text-brand" : "hover:text-brand"}`}
          >
            {node.name}
          </button>
        ) : (
          <span className="grow truncate text-appText">{node.name}</span>
        )}

        {!isFolder && (
          <button
            type="button"
            onClick={() => onOpenFile?.(node.contract)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-appBorder bg-appSurface px-2 py-1 text-xs font-medium text-appText transition hover:border-brand hover:text-brand"
          >
            <Eye className="h-3 w-3" />
          </button>
        )}
      </div>

      {isFolder && expanded && hasChildren && (
        <div className="space-y-0">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expandedFolders[child.id] ?? false}
              expandedFolders={expandedFolders}
              onToggle={onToggle}
              onOpenFile={onOpenFile}
              onSelectFolder={onSelectFolder}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getDisplayName(filePath) {
  if (!filePath) return "ملف بدون اسم";
  return String(filePath).split(/[\\/]/).filter(Boolean).pop() || "ملف بدون اسم";
}

function getOtherContractsRelativePath(filePath) {
  if (!filePath) return "";
  const normalized = String(filePath).replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  const otherIndex = parts.findIndex((part) => part === "OtherTypesContracts");
  if (otherIndex >= 0) {
    return parts.slice(otherIndex + 1).join("/");
  }
  return "";
}

function hasFileExtension(value) {
  return /\.[A-Za-z0-9]+$/.test(String(value || ""));
}

function buildOtherContractsTree(contracts, folders = []) {
  const root = { id: "root", type: "folder", name: "root", path: "", children: [] };

  (contracts || []).forEach((contract) => {
    const relativePath = getOtherContractsRelativePath(contract?.filePath);
    if (!relativePath) return;

    const segments = relativePath.split("/").filter(Boolean);
    let current = root;
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath = `${currentPath}${currentPath ? "/" : ""}${segment}`;
      const isLeaf = index === segments.length - 1;
      const isFile = isLeaf && hasFileExtension(segment);

      let child = current.children.find((item) => item.name === segment);
      if (!child) {
        child = {
          id: `${current.id}-${segment}-${index}`,
          name: segment,
          type: isFile ? "file" : "folder",
          path: currentPath,
          children: isFile ? undefined : [],
          contract: isFile ? contract : undefined,
        };
        current.children.push(child);
      }

      if (!isFile && child.type !== "folder") {
        child.type = "folder";
        child.children = child.children || [];
      }

      current = child;
    });
  });

  (folders || []).forEach((folderPath) => {
    const segments = String(folderPath).replace(/\\/g, "/").split("/").filter(Boolean);
    let current = root;
    let currentPath = "";

    segments.forEach((segment, index) => {
      currentPath = `${currentPath}${currentPath ? "/" : ""}${segment}`;
      let child = current.children.find((item) => item.name === segment && item.type === "folder");
      if (!child) {
        child = {
          id: `${current.id}-${segment}-folder-${index}`,
          name: segment,
          type: "folder",
          path: currentPath,
          children: [],
        };
        current.children.push(child);
      }
      current = child;
    });
  });

  const sortTree = (node) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortTree);
  };

  sortTree(root);
  return root.children;
}

export default function CompanyDetailPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedOtherPath, setSelectedOtherPath] = useState("");
  const [createdOtherFolders, setCreatedOtherFolders] = useState([]);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isFolderCreating, setIsFolderCreating] = useState(false);
  const [previewState, setPreviewState] = useState({
    isOpen: false,
    loading: false,
    title: "",
    url: null,
    contentType: "",
    textContent: "",
    error: "",
  });

  const creatingContracts = useMemo(() => {
    return Array.isArray(company?.contracts)
      ? company.contracts.filter((contract) => contract?.type === "CREATING")
      : [];
  }, [company]);

  const updatingContracts = useMemo(() => {
    return Array.isArray(company?.contracts)
      ? company.contracts.filter((contract) => contract?.type === "UPDATING")
      : [];
  }, [company]);

  const otherContracts = useMemo(() => {
    return Array.isArray(company?.contracts)
      ? company.contracts.filter((contract) => contract?.type === "OTHER")
      : [];
  }, [company]);

  const otherContractsTree = useMemo(
    () => buildOtherContractsTree(otherContracts, createdOtherFolders),
    [otherContracts, createdOtherFolders]
  );

  useEffect(() => {
    let cancelled = false;

    const loadCompany = async () => {
      setLoading(true);
      setError(null);

      try {
        const companyData = await fetchCompanyById(companyId);
        if (cancelled) return;
        setCompany(companyData);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "تعذر تحميل بيانات الشركة."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (companyId) {
      loadCompany();
    } else {
      setError("معرّف الشركة غير صالح.");
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const handleToggle = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleBack = () => {
    navigate("/companies");
  };

  const refreshCompany = async () => {
    if (!companyId) return;
    try {
      const companyData = await fetchCompanyById(companyId);
      setCompany(companyData);
    } catch (err) {
      setError(getApiErrorMessage(err, "تعذر تحديث بيانات الشركة."));
    }
  };

  const handleUploadOtherContract = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !company?.id) {
      return;
    }

    try {
      setIsFileUploading(true);
      const companyFolder = `${company.id} - ${company.companyName || "company"}`;
      await uploadOtherContractFile(file, companyFolder, company.id, selectedOtherPath);
      event.target.value = "";
      setCreatedOtherFolders((prev) => {
        if (!selectedOtherPath) return prev;
        return prev.includes(selectedOtherPath) ? prev : [...prev, selectedOtherPath];
      });
      await refreshCompany();
    } catch (err) {
      setError(getApiErrorMessage(err, "تعذر رفع الملف."));
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleCreateOtherFolder = async () => {
    const folderName = window.prompt("أدخل اسم المجلد الجديد:");
    if (!folderName?.trim() || !company?.id) {
      return;
    }

    try {
      setIsFolderCreating(true);
      const companyFolder = `${company.id} - ${company.companyName || "company"}`;
      await createOtherContractFolder(companyFolder, folderName.trim(), selectedOtherPath);
      const newFolderPath = selectedOtherPath ? `${selectedOtherPath}/${folderName.trim()}` : folderName.trim();
      setCreatedOtherFolders((prev) => (prev.includes(newFolderPath) ? prev : [...prev, newFolderPath]));
      setSelectedOtherPath(newFolderPath);
      await refreshCompany();
    } catch (err) {
      setError(getApiErrorMessage(err, "تعذر إنشاء المجلد."));
    } finally {
      setIsFolderCreating(false);
    }
  };

  const closePreview = () => {
    if (previewState.url) {
      URL.revokeObjectURL(previewState.url);
    }
    setPreviewState({
      isOpen: false,
      loading: false,
      title: "",
      url: null,
      contentType: "",
      textContent: "",
      error: "",
    });
  };

  const handleOpenFile = async (contract) => {
    if (!contract?.filePath) {
      setPreviewState({
        isOpen: true,
        loading: false,
        title: "ملف غير متاح",
        url: null,
        contentType: "",
        textContent: "",
        error: "لا يوجد مسار ملف لهذا المستند.",
      });
      return;
    }

    if (previewState.url) {
      URL.revokeObjectURL(previewState.url);
    }

    setPreviewState((prev) => ({ ...prev, isOpen: true, loading: true, error: "" }));

    try {
      const response = await apiClient.get("/files/preview", {
        params: { path: contract.filePath },
        responseType: "blob",
      });

      const blob = response.data;
      const contentType = response.headers["content-type"] || "application/octet-stream";
      const isText =
        contentType.startsWith("text/") ||
        contentType.includes("json") ||
        contentType.includes("xml") ||
        contentType.includes("javascript");

      let textContent = "";
      if (isText) {
        textContent = await blob.text();
      }

      const objectUrl = URL.createObjectURL(blob);

      setPreviewState({
        isOpen: true,
        loading: false,
        title: getDisplayName(contract.filePath),
        url: objectUrl,
        contentType,
        textContent,
        error: "",
      });
    } catch (err) {
      setPreviewState({
        isOpen: true,
        loading: false,
        title: getDisplayName(contract.filePath),
        url: null,
        contentType: "",
        textContent: "",
        error: getApiErrorMessage(err, "تعذر فتح الملف."),
      });
    }
  };

  return (
    <MainLayout title="ملف الشركة" subtitle="تفاصيل الشركة ومستنداتها">
      <div className="space-y-6">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-appBorder bg-appSurface px-4 py-3 text-sm font-semibold text-appText shadow-panel ui-transition hover:border-brand/60 hover:text-brand"
        >
          <ArrowLeft className="h-4 w-4" />
          العودة إلى الشركات
        </button>

        {loading ? (
          <div className="grid gap-4">
            <div className="h-[200px] animate-pulse rounded-3xl border border-appBorder bg-appMuted/80" />
            <div className="h-[250px] animate-pulse rounded-3xl border border-appBorder bg-appMuted/80" />
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-danger/30 bg-badgeRedBg/25 p-6 text-sm text-appText">
            <div className="flex items-center gap-2 text-danger">
              <AlertCircle className="h-5 w-5" />
              {error}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Company Info */}
            <div className="rounded-3xl border border-appBorder bg-appSurface p-6 shadow-raise">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-appSubtext">
                    اسم الشركة
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-appText">
                    {company?.companyName || "-"}
                  </h1>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-appBorder bg-appMuted/70 p-4">
                    <p className="text-xs text-appSubtext">نوع الشركة</p>
                    <p className="mt-2 text-sm font-semibold text-appText">
                      {company?.companyType || "غير محدد"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-appBorder bg-appMuted/70 p-4">
                    <p className="text-xs text-appSubtext">رقم السجل التجاري</p>
                    <p className="mt-2 text-sm font-semibold text-appText">
                      {company?.commercialRegisterNumber || "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-appBorder bg-appMuted/70 p-4">
                    <p className="text-xs text-appSubtext">آخر تحديث</p>
                    <p className="mt-2 text-sm font-semibold text-appText">
                      {formatDateTimeShort(company?.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-appBorder bg-appMuted/70 p-4">
                  <p className="text-xs text-appSubtext">العنوان</p>
                  <p className="mt-2 text-sm leading-relaxed text-appText">
                    {company?.companyAddress || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Creating Contract */}
            <div className="rounded-3xl border border-brand/30 bg-appSurface p-6 shadow-raise">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand" />
                <h2 className="text-lg font-semibold text-appText">عقد التأسيس</h2>
              </div>
              {creatingContracts.length === 0 ? (
                <p className="text-sm text-appSubtext">لا يوجد عقد تأسيس مرتبط بهذه الشركة.</p>
              ) : (
                <div className="space-y-2">
                  {creatingContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center gap-3 rounded-xl border border-appBorder bg-appMuted/60 px-3 py-2"
                    >
                      <FileText className="h-4 w-4 text-appSubtext" />
                      <span className="grow text-sm text-appText">
                        {getDisplayName(contract.filePath)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenFile(contract)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-appBorder bg-appSurface px-2 py-1 text-xs font-medium text-appText transition hover:border-brand hover:text-brand"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Updating Contracts */}
            <div className="rounded-3xl border border-appBorder bg-appSurface p-6 shadow-raise">
              <div className="mb-4 flex items-center gap-2">
                <Folder className="h-5 w-5 text-brand" />
                <h2 className="text-lg font-semibold text-appText">عقود التعديل</h2>
              </div>
              <div className="space-y-2">
                {updatingContracts.length === 0 ? (
                  <p className="text-sm text-appSubtext">لا توجد عقود تعديل مرتبطة بهذه الشركة.</p>
                ) : (
                  updatingContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center gap-3 rounded-xl border border-appBorder bg-appMuted/60 px-3 py-2"
                    >
                      <FileText className="h-4 w-4 text-appSubtext" />
                      <span className="grow text-sm text-appText">
                        {getDisplayName(contract.filePath)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenFile(contract)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-appBorder bg-appSurface px-2 py-1 text-xs font-medium text-appText transition hover:border-brand hover:text-brand"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Other Contracts */}
            <div className="rounded-3xl border border-appBorder bg-appSurface p-6 shadow-raise">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Folder className="h-5 w-5 text-brand" />
                <h2 className="text-lg font-semibold text-appText">عقود أخرى</h2>
                <div className="ml-auto flex flex-wrap gap-2">
                  <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-appBorder bg-appSurface px-3 py-2 text-sm font-medium text-appText transition hover:border-brand hover:text-brand ${isFileUploading ? "opacity-60 pointer-events-none" : ""}`}>
                    <span>{isFileUploading ? "جارٍ الرفع..." : `رفع ملف إلى ${selectedOtherPath || "المجلد الرئيسي"}`}</span>
                    <input type="file" className="hidden" onChange={handleUploadOtherContract} disabled={isFileUploading} />
                  </label>
                  <button
                    type="button"
                    onClick={handleCreateOtherFolder}
                    disabled={isFolderCreating}
                    className={`inline-flex items-center gap-2 rounded-xl border border-appBorder bg-appSurface px-3 py-2 text-sm font-medium text-appText transition hover:border-brand hover:text-brand ${isFolderCreating ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    {isFolderCreating ? "جارٍ الإنشاء..." : "إنشاء مجلد"}
                  </button>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-appBorder bg-appMuted/60 px-3 py-3 text-sm text-appText">
                  <span className="font-medium text-appText">المسار الحالي:</span>
                  <span className="rounded-full bg-appSurface px-3 py-1 text-sm text-appText">
                    {selectedOtherPath || "المجلد الرئيسي"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedOtherPath("")}
                    className="inline-flex items-center gap-2 rounded-xl border border-appBorder bg-appSurface px-3 py-2 text-sm font-medium text-appText transition hover:border-brand hover:text-brand"
                  >
                    اختر المجلد الرئيسي
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {otherContractsTree.length === 0 ? (
                  <p className="text-sm text-appSubtext">لا توجد عقود أخرى مرتبطة بهذه الشركة.</p>
                ) : (
                  otherContractsTree.map((node) => (
                    <FileTreeNode
                      key={node.id}
                      node={node}
                      depth={0}
                      expanded={expandedFolders[node.id] ?? false}
                      expandedFolders={expandedFolders}
                      onToggle={handleToggle}
                      onOpenFile={handleOpenFile}
                      onSelectFolder={setSelectedOtherPath}
                      selectedPath={selectedOtherPath}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {previewState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-appBorder bg-appSurface shadow-2xl">
            <div className="flex items-center justify-between border-b border-appBorder px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-appText">{previewState.title}</p>
                {previewState.contentType && (
                  <p className="text-xs text-appSubtext">{previewState.contentType}</p>
                )}
              </div>
              <button
                type="button"
                onClick={closePreview}
                className="rounded-full border border-appBorder bg-appMuted/70 p-2 text-appSubtext transition hover:text-appText"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-appMuted/40 p-4">
              {previewState.loading ? (
                <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-appBorder bg-appSurface/80 text-sm text-appSubtext">
                  جاري تحميل الملف...
                </div>
              ) : previewState.error ? (
                <div className="rounded-2xl border border-danger/30 bg-badgeRedBg/25 p-4 text-sm text-appText">
                  {previewState.error}
                </div>
              ) : previewState.contentType?.includes("pdf") && previewState.url ? (
                <iframe
                  src={previewState.url}
                  title={previewState.title}
                  className="h-full min-h-[70vh] w-full rounded-2xl border border-appBorder bg-white"
                />
              ) : previewState.contentType?.startsWith("image/") && previewState.url ? (
                <div className="flex h-full min-h-[70vh] items-center justify-center rounded-2xl border border-appBorder bg-white p-4">
                  <img
                    src={previewState.url}
                    alt={previewState.title}
                    className="max-h-[70vh] max-w-full object-contain"
                  />
                </div>
              ) : previewState.textContent ? (
                <pre className="whitespace-pre-wrap break-words rounded-2xl border border-appBorder bg-appSurface p-4 text-sm leading-6 text-appText">
                  {previewState.textContent}
                </pre>
              ) : previewState.url ? (
                <div className="rounded-2xl border border-appBorder bg-appSurface p-4 text-sm text-appSubtext">
                  لا يمكن معاينة هذا النوع من الملفات مباشرة. يمكنك فتحه في نافذة جديدة.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
