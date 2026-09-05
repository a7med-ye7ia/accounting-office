import { useState } from "react";
import { FileSearch, FileText, ListTree } from "lucide-react";
import { getContractTypeMeta } from "../services/companyWorkflow";
import ArticleOverlay from "./ArticleOverlay";

function Field({ label, value }) {
  return (
    <div className="rounded-lg border border-appBorder bg-appMuted p-3">
      <p className="text-xs font-semibold text-appSubtext">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-appText">{value || "غير محدد"}</p>
    </div>
  );
}

function ViewToggle({ value, active, icon, children, onClick }) {
  const ToggleIcon = icon;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold ui-transition ${
        active ? "bg-appSurface text-brand shadow-sm" : "text-appSubtext hover:text-appText"
      }`}
    >
      <ToggleIcon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}

function EmptyArticlesMessage() {
  return (
    <p className="rounded-lg border border-dashed border-appBorder bg-appMuted p-4 text-sm text-appSubtext">
      لا توجد مواد محفوظة لهذا المستند.
    </p>
  );
}

function EstablishmentDetails({ pdf }) {
  return (
    <section className="rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel">
      <div className="flex items-center gap-3 border-b border-appBorder pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-appBorder bg-appMuted text-brand">
          <FileText className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-bold text-appText">تفاصيل عقد التأسيس</h3>
          <p className="text-xs text-appSubtext">بيانات مستخرجة من OCR ومحفوظة مع العقد.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="اسم الشركة" value={pdf.company_name} />
        <Field label="عنوان الشركة" value={pdf.company_address} />
        <Field label="نوع الشركة" value={pdf.company_type} />
        <Field label="رأس المال" value={pdf.company_capital} />
        <Field label="رقم السجل التجاري" value={pdf.commercial_register_number} />
        <Field label="تاريخ الموافقة" value={pdf.approval_date} />
        <Field label="رقم محضر السجل العقاري" value={pdf.real_estate_registry_minutes_number} />
        <Field label="مدة الشركة" value={pdf.company_duration} />
        <div className="md:col-span-2">
          <Field label="نشاط الشركة" value={pdf.company_activity} />
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-bold text-appText">المواد</h4>
        <div className="mt-3 space-y-3">
          {pdf.articles?.length > 0 ? (
            pdf.articles.map((article, index) => (
              <div key={article.id || index} className="rounded-lg border border-appBorder bg-appMuted p-4">
                <p className="text-xs font-bold text-brand">المادة {article.id || index + 1}</p>
                <p className="mt-2 text-sm leading-7 text-appText">{article.value || article.content}</p>
              </div>
            ))
          ) : (
            <EmptyArticlesMessage />
          )}
        </div>
      </div>
    </section>
  );
}

export default function PdfViewer({ pdf, company, onSelectArticle }) {
  const [viewMode, setViewMode] = useState("articles");
  const isEstablishment = pdf.type === "establishment";
  const meta = getContractTypeMeta(pdf.type);
  const articles = Array.isArray(pdf.articles) ? pdf.articles : [];

  return (
    <div className="animate-fadeIn space-y-6">
      <section className="rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-appBorder bg-appMuted text-brand">
              <FileText className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand">{company.name}</p>
              <h2 className="mt-1 truncate text-2xl font-bold text-appText">{pdf.name}</h2>
              <p className="mt-2 text-sm text-appSubtext">
                {meta.label}
                {pdf.date ? ` • ${pdf.date}` : ""}
              </p>
            </div>
          </div>

          {!isEstablishment && (
            <div className="inline-flex rounded-lg border border-appBorder bg-appMuted p-1">
              <ViewToggle value="articles" active={viewMode === "articles"} icon={ListTree} onClick={setViewMode}>
                المواد
              </ViewToggle>
              <ViewToggle value="preview" active={viewMode === "preview"} icon={FileSearch} onClick={setViewMode}>
                المعاينة
              </ViewToggle>
            </div>
          )}
        </div>
      </section>

      {isEstablishment ? (
        <EstablishmentDetails pdf={pdf} />
      ) : viewMode === "articles" ? (
        <section className="rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-appText">مواد المستند</h3>
              <p className="mt-1 text-xs text-appSubtext">اضغط على أي مادة لفتح محادثة حولها.</p>
            </div>
          </div>
          {articles.length > 0 ? (
            <ArticleOverlay articles={articles} onSelectArticle={onSelectArticle} type={pdf.type} />
          ) : (
            <EmptyArticlesMessage />
          )}
        </section>
      ) : (
        <section className="rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel">
          <div className="space-y-3" dir="rtl">
            {articles.length > 0 ? (
              articles.map((article) => (
                <button
                  type="button"
                  key={article.id}
                  className="w-full rounded-lg border border-appBorder bg-appMuted p-4 text-right ui-transition hover:border-brand/40 hover:bg-appSurface"
                  onClick={() => onSelectArticle(article)}
                >
                  <h4 className="font-bold text-appText">
                    {article.title} - {article.subtitle}
                  </h4>
                  <p className="mt-2 text-sm leading-6 text-appSubtext">{article.content}</p>
                </button>
              ))
            ) : (
              <EmptyArticlesMessage />
            )}
          </div>
        </section>
      )}
    </div>
  );
}