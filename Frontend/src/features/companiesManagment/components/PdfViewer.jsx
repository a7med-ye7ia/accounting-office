import { useState } from "react";
import { mockArticles } from "../../../shared/data/mockData";
import ArticleOverlay from "./ArticleOverlay";

function Field({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium text-appSubtext mb-1">{label}</label>
      <p className="text-appText bg-appMuted border border-appBorder p-3 rounded-xl">
        {value || "غير محدد"}
      </p>
    </div>
  );
}

export default function PdfViewer({ pdf, company, onSelectArticle }) {
  const [viewMode, setViewMode] = useState("articles");

  const isEstablishment = pdf.type === "establishment";
  const activeToggle = isEstablishment ? "text-brand" : "text-badgePurpleText";
  const inactiveToggle = "text-appSubtext hover:text-appText";

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-8 space-y-1">
        <h2 className="text-2xl font-bold text-appText">{pdf.name}</h2>
        <p className="text-appSubtext text-sm">
          {company.name} • {pdf.date}
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="bg-appMuted rounded-2xl p-1.5 flex gap-1 border border-appBorder">
          <button
            type="button"
            onClick={() => setViewMode("articles")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium ui-transition cursor-pointer ${
              viewMode === "articles"
                ? `bg-appSurface shadow-panel border border-appBorder ${activeToggle}`
                : inactiveToggle
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              عرض المواد
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("preview")}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium ui-transition cursor-pointer ${
              viewMode === "preview"
                ? `bg-appSurface shadow-panel border border-appBorder ${activeToggle}`
                : inactiveToggle
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              معاينة المستند
            </span>
          </button>
        </div>
      </div>

      {isEstablishment ? (
        <div className="max-w-4xl mx-auto rounded-2xl border border-appBorder bg-appSurface shadow-panel p-8" dir="rtl">
          <h3 className="text-xl font-bold text-appText mb-6 text-center">تفاصيل عقد التأسيس</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Field label="اسم الشركة" value={pdf.company_name} />
            <Field label="عنوان الشركة" value={pdf.company_address} />
            <Field label="نوع الشركة" value={pdf.company_type} />
            <Field label="رأس المال" value={pdf.company_capital} />
            <Field label="رقم السجل التجاري" value={pdf.commercial_register_number} />
            <Field label="تاريخ الموافقة" value={pdf.approval_date} />
            <Field label="رقم محضر السجل العقاري" value={pdf.real_estate_registry_minutes_number} />
            <Field label="مدة الشركة" value={pdf.company_duration} />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-appSubtext mb-1">نشاط الشركة</label>
              <p className="text-appText bg-appMuted border border-appBorder p-3 rounded-xl">
                {pdf.company_activity || "غير محدد"}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-lg font-semibold text-appText mb-4">المرجع القانوني</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="رقم القانون" value={pdf.law_reference?.law_number} />
              <Field label="سنة القانون" value={pdf.law_reference?.law_year} />
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-appText mb-4">المواد</h4>
            <div className="space-y-4">
              {pdf.articles && pdf.articles.length > 0 ? (
                pdf.articles.map((article, index) => (
                  <div
                    key={article.id || index}
                    className="bg-appMuted p-4 rounded-xl border border-appBorder ui-transition hover:border-brand/25"
                  >
                    <h5 className="font-medium text-appText mb-2">المادة {article.id}</h5>
                    <p className="text-appText/90 leading-relaxed">{article.value}</p>
                  </div>
                ))
              ) : (
                <p className="text-appSubtext">لا توجد مواد محددة</p>
              )}
            </div>
          </div>
        </div>
      ) : viewMode === "articles" ? (
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-center gap-2 mb-4 text-sm font-medium ${activeToggle}`}>
            <span>اضغط على أي مادة لفتح محادثة حولها</span>
          </div>
          <ArticleOverlay articles={mockArticles} onSelectArticle={onSelectArticle} type={pdf.type} />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-appBorder bg-appSurface shadow-panel overflow-hidden">
            <div className="p-8 space-y-6" dir="rtl">
              {mockArticles.map((article) => (
                <button
                  type="button"
                  key={article.id}
                  className="w-full text-right p-4 rounded-xl border border-appBorder bg-appMuted/40 hover:bg-appMuted ui-transition cursor-pointer"
                  onClick={() => onSelectArticle(article)}
                >
                  <h4 className="font-bold text-appText mb-2">
                    {article.title} - {article.subtitle}
                  </h4>
                  <p className="text-sm text-appSubtext leading-relaxed">{article.content}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
