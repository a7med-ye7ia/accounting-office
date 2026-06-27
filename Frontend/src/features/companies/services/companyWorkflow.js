import { useCallback, useEffect, useState } from "react";
import { fetchCompanies } from "../../../api/companies";

export const COMPANY_LOAD_ERROR = "فشل تحميل الشركات. حاول مرة أخرى لاحقا.";

export const CONTRACT_TYPES = {
  establishment: {
    key: "establishment",
    apiTypes: ["ESTABLISHMENT", "CREATING"],
    label: "عقود تأسيس",
    shortLabel: "تأسيس",
    emptyLabel: "لا توجد عقود تأسيس",
  },
  amendment: {
    key: "amendment",
    apiTypes: ["AMENDMENT", "UPDATING"],
    label: "عقود تعديل",
    shortLabel: "تعديل",
    emptyLabel: "لا توجد عقود تعديل",
  },
  other: {
    key: "other",
    apiTypes: ["OTHER"],
    label: "عقود وملفات أخرى",
    shortLabel: "أخرى",
    emptyLabel: "لا توجد ملفات أخرى",
  },
};

export const isKnownContractType = (type) =>
  Object.prototype.hasOwnProperty.call(CONTRACT_TYPES, type);

export const getContractTypeMeta = (type) =>
  CONTRACT_TYPES[type] || CONTRACT_TYPES.other;

export function getCompanyContractCounts(company) {
  const establishment = company?.establishmentContracts?.length ?? 0;
  const amendment = company?.amendmentContracts?.length ?? 0;
  const other = company?.otherContracts?.length ?? 0;

  return {
    establishment,
    amendment,
    other,
    total: establishment + amendment + other,
  };
}

export function getContractsByType(company, contractType) {
  if (!company) return [];
  if (contractType === "establishment") return company.establishmentContracts || [];
  if (contractType === "amendment") return company.amendmentContracts || [];
  return company.otherContracts || [];
}

function workflowTypeFromApi(apiType) {
  const normalized = String(apiType || "").toUpperCase();
  return Object.values(CONTRACT_TYPES).find((meta) => meta.apiTypes.includes(normalized))?.key || "other";
}

function fileNameFromPath(filePath, fallback) {
  if (!filePath) return fallback;
  const parts = String(filePath).split(/[\\/]/).filter(Boolean);
  return parts.at(-1) || fallback;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ar-EG");
}

function fallbackOcrData(contract, company) {
  return {
    company_name: company.name,
    company_type: company.companyType,
    commercial_register_number: company.commercialRegNo,
    contract_id: contract.id,
    articles: [],
  };
}

function parseOcrData(contract, company) {
  if (!contract.ocrData) return fallbackOcrData(contract, company);

  try {
    const parsed = JSON.parse(contract.ocrData);
    return {
      ...fallbackOcrData(contract, company),
      ...parsed,
      articles: Array.isArray(parsed.articles) ? parsed.articles : [],
    };
  } catch (error) {
    console.warn("Invalid OCR data for contract:", contract.id, error);
    return fallbackOcrData(contract, company);
  }
}

export function normalizeArticle(article, index, sourceName = "") {
  const rawId = article?.id || index + 1;
  const content = article?.content || article?.value || article?.text || "";
  return {
    ...article,
    id: rawId,
    title: article?.title || `المادة ${rawId}`,
    subtitle: article?.subtitle || sourceName,
    content,
    value: article?.value || content,
  };
}

function mapContract(contract, company) {
  const type = workflowTypeFromApi(contract.type);
  const name = fileNameFromPath(contract.filePath, `Contract ${contract.id}`);
  const mappedContract = {
    ...contract,
    id: contract.id,
    name,
    type,
    apiType: contract.type,
    date: formatDate(contract.createdAt),
    rawDate: contract.createdAt,
    size: contract.size || "N/A",
  };

  const ocrData = parseOcrData(contract, company);
  return {
    ...mappedContract,
    ...ocrData,
    articles: (ocrData.articles || []).map((article, index) => normalizeArticle(article, index, name)),
  };
}

export function mapCompanyFromApi(company) {
  const contracts = (company.contracts || []).map((contract) => mapContract(contract, company));

  return {
    ...company,
    id: company.id,
    icon: "building",
    name: company.name,
    description: company.companyType,
    establishmentContracts: contracts.filter((contract) => contract.type === "establishment"),
    amendmentContracts: contracts.filter((contract) => contract.type === "amendment"),
    otherContracts: contracts.filter((contract) => contract.type === "other"),
  };
}

export function useCompaniesWorkflowData() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchCompanies();
      setCompanies((Array.isArray(data) ? data : []).map(mapCompanyFromApi));
    } catch (loadError) {
      console.error("Error fetching companies:", loadError);
      setError(COMPANY_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    companies,
    loading,
    error,
    reload,
  };
}