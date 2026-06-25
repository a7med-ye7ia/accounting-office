// ─────────────────────────────────────────────────────────
// PDF Generation Utilities
// ─────────────────────────────────────────────────────────
import companyExampleData from "../../../../shared/data/companyExampleData.json";
import apiClient from "../../../../api/client";

/**
 * Builds the Arabic intro paragraph from company data fields.
 */
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
  if (real_estate_registry_minutes_number)
    parts.push(`وبمقتضى محضر الشهر العقاري رقم ${real_estate_registry_minutes_number}`);
  if (company_address) parts.push(`ومركزها الرئيسي ${company_address}`);
  if (company_capital) parts.push(`ورأس مالها ${company_capital}`);
  if (company_duration) parts.push(`ومدة الشركة ${company_duration}`);
  if (company_activity) parts.push(`وغرضها ${company_activity}`);

  return parts.join("، ") + ".";
}

/**
 * Builds the full PDF payload object and suggested file name from
 * company data and the array of amendment sections.
 */
export function buildAmendmentPdfPayload(company, sections) {
  const changedArticles = sections
    .map((s) => s.selectedArticleId || s.selectedArticleTitle)
    .filter(Boolean);
  const titleSuffix = changedArticles.length
    ? changedArticles.join("، ")
    : `${sections.length} مواد`;

  const merged = {
    ...companyExampleData,
    ...company,
    name: company?.name || companyExampleData.company_name,
  };
  const introParagraph = buildCompanyIntro(merged);

  return {
    payload: {
      contractTitle: `عقد تعديل المادة ${titleSuffix}`,
      companyName: merged.name,
      companyLegalLine:
        company?.legalLine ||
        `شركة ${merged.company_type} خاضعة لأحكام القانون رقم ${merged.law_reference.law_number} لسنة ${merged.law_reference.law_year}`,
      introText: company?.preamble || introParagraph || "",
      sections: sections.map((s) => ({
        id: s.id,
        selectedArticleId: s.selectedArticleId,
        selectedArticleTitle: s.selectedArticleTitle,
        beforeText: s.beforeText,
        afterText: s.afterText || s.modelOutput,
        modelOutput: s.modelOutput || "",
        embeddingScore: s.embeddingScore || null,
      })),
    },
    fileName: `تعديل_${
      changedArticles.length ? changedArticles.join("_") : "multiple_articles"
    }.pdf`,
  };
}

/**
 * Calls the backend to render a PDF and returns the blob.
 * Low-level — use generateAmendmentPdfBlob for the full flow.
 */
export async function generateAmendmentPdfBlobFromPayload(payload, fileName) {
  const response = await apiClient.post("/pdf/generate", payload, {
    responseType: "blob",
  });
  const blob = response.data;
  return { blob, fileName };
}

/**
 * High-level helper: builds the payload then fetches the PDF blob.
 */
export async function generateAmendmentPdfBlob(company, sections) {
  const { payload, fileName } = buildAmendmentPdfPayload(company, sections);
  const { blob } = await generateAmendmentPdfBlobFromPayload(payload, fileName);
  return { blob, fileName, payload };
}
