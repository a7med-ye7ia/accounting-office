import { useCallback, useEffect, useState } from "react";
import { fetchCompanies } from "../../../api/companies";

export const COMPANY_LOAD_ERROR = "فشل تحميل الشركات. حاول مرة أخرى لاحقًا.";

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
    apiTypes: ["UPDATING"],
    label: "عقود تعديل",
    shortLabel: "تعديل",
    emptyLabel: "لا توجد عقود تعديل",
  },
  other: {
    key: "other",
    apiTypes: [],
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

  if (contractType === "establishment") {
    return company.establishmentContracts || [];
  }

  if (contractType === "other") {
    return company.otherContracts || [];
  }

  return company.amendmentContracts || [];
}

function fallbackOcrData(contract, company) {
  return {
    company_name: company.name,
    company_type: company.companyType,
    commercial_register_number: company.commercialRegNo,
    contract_id: contract.id,
  };
}

function parseOcrData(contract, company) {
  if (!contract.ocrData) {
    return fallbackOcrData(contract, company);
  }

  try {
    return JSON.parse(contract.ocrData);
  } catch (error) {
    console.warn("Invalid OCR data for contract:", contract.id, error);
    return fallbackOcrData(contract, company);
  }
}

function mapContract(contract, company, type) {
  const mappedContract = {
    id: contract.id,
    name: contract.filePath || `Contract ${contract.id}`,
    type,
    date: contract.createdAt,
    size: "N/A",
  };

  if (type !== "establishment") {
    return mappedContract;
  }

  return {
    ...mappedContract,
    ...parseOcrData(contract, company),
  };
}

function contractMatchesType(contract, typeKey) {
  const apiTypes = CONTRACT_TYPES[typeKey]?.apiTypes || [];
  return apiTypes.includes(contract.type);
}

export function mapCompanyFromApi(company) {
  const contracts = company.contracts || [];

  return {
    id: company.id,
    icon: "building",
    name: company.name,
    description: company.companyType,
    establishmentContracts: contracts
      .filter((contract) => contractMatchesType(contract, "establishment"))
      .map((contract) => mapContract(contract, company, "establishment")),
    amendmentContracts: contracts
      .filter((contract) => contractMatchesType(contract, "amendment"))
      .map((contract) => mapContract(contract, company, "amendment")),
    otherContracts: [],
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
      setCompanies((data || []).map(mapCompanyFromApi));
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
