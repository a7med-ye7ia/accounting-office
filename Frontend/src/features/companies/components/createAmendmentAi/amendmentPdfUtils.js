import apiClient from "../../../../api/client";

export function buildCompanyIntro(data) {
  if (!data) return "";
  const {
    company_name,
    company_type,
    law_reference,
    company_address,
    company_capital,
    commercial_register_number,
    approval_date,
    real_estate_registry_minutes_number,
    company_duration,
    company_activity,
  } = data;

  const lawRef =
    law_reference?.law_number && law_reference?.law_year
      ? `رقم ${law_reference.law_number} لسنة ${law_reference.law_year}`
      : "";

  const parts = [];

  if (company_name && company_type) {
    parts.push(`سبق وأن تكونت شركة ${company_name} (${company_type})`);
  } else if (company_name) {
    parts.push(`سبق وأن تكونت شركة ${company_name}`);
  }

  if (lawRef) parts.push(`خاضعة لأحكام القانون ${lawRef}`);
  if (approval_date) parts.push(`بموجب الموافقة الصادرة بتاريخ ${approval_date}`);
  if (commercial_register_number) parts.push(`والقيد برقم ${commercial_register_number} بالسجل التجاري`);
  if (real_estate_registry_minutes_number) {
    parts.push(`وبمقتضى محضر الشهر العقاري رقم ${real_estate_registry_minutes_number}`);
  }
  if (company_address) parts.push(`ومركزها الرئيسي ${company_address}`);
  if (company_capital) parts.push(`ورأس مالها ${company_capital}`);
  if (company_duration) parts.push(`ومدة الشركة ${company_duration}`);
  if (company_activity) parts.push(`وغرضها ${company_activity}`);

  return parts.length ? `${parts.join("، ")}.` : "";
}

export function buildAmendmentPdfPayload(company, sections) {
  const changedArticles = sections
    .map((section) => section.selectedArticleId || section.selectedArticleTitle)
    .filter(Boolean);
  const titleSuffix = changedArticles.length ? changedArticles.join("، ") : `${sections.length} مواد`;

  const merged = {
    ...(company || {}),
    company_name: company?.company_name || company?.name || "",
    name: company?.name || company?.company_name || "",
    law_reference: company?.law_reference || {},
  };
  const introParagraph = buildCompanyIntro(merged);
  const legalLine =
    company?.legalLine ||
    (merged.company_type && merged.law_reference?.law_number && merged.law_reference?.law_year
      ? `شركة ${merged.company_type} خاضعة لأحكام القانون رقم ${merged.law_reference.law_number} لسنة ${merged.law_reference.law_year}`
      : "");

  return {
    payload: {
      contractTitle: `عقد تعديل المادة ${titleSuffix}`,
      companyName: merged.name,
      companyLegalLine: legalLine,
      introText: company?.preamble || introParagraph || "",
      sections: sections.map((section) => ({
        id: section.id,
        selectedArticleId: section.selectedArticleId,
        selectedArticleTitle: section.selectedArticleTitle,
        beforeText: section.beforeText,
        afterText: section.afterText || section.modelOutput,
        modelOutput: section.modelOutput || "",
        embeddingScore: section.embeddingScore || null,
      })),
    },
    fileName: `تعديل_${changedArticles.length ? changedArticles.join("_") : "multiple_articles"}.pdf`,
  };
}

export async function generateAmendmentPdfBlobFromPayload(payload, fileName) {
  const response = await apiClient.post("/pdf/generate", payload, {
    responseType: "blob",
  });
  return { blob: response.data, fileName };
}

export async function generateAmendmentPdfBlob(company, sections) {
  const { payload, fileName } = buildAmendmentPdfPayload(company, sections);
  const { blob } = await generateAmendmentPdfBlobFromPayload(payload, fileName);
  return { blob, fileName, payload };
}

export async function saveAmendmentContract(companyId, company, sections) {
  const { payload, fileName } = buildAmendmentPdfPayload(company, sections);
  const response = await apiClient.post("/contracts/amendments/generate", {
    companyId,
    fileName,
    pdf: payload,
  });
  return response.data;
}
