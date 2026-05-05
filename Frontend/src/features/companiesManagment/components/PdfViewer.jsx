import { useState } from "react";
import { mockArticles } from "../../../shared/data/mockData";
import ArticleOverlay from "./ArticleOverlay";

export default function PdfViewer({ pdf, company, onSelectArticle }) {
  const [viewMode, setViewMode] = useState("articles");

  const isEstablishment = pdf.type === "establishment";

  return (
    <div className="animate-fadeIn">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">
          {pdf.name}
        </h2>
        <p className="text-slate-500 text-sm">
          {company.name} • {pdf.date}
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
          <button
            onClick={() => setViewMode("articles")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              viewMode === "articles"
                ? `bg-white shadow-sm ${
                    isEstablishment ? "text-indigo-600" : "text-amber-600"
                  }`
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              عرض المواد
            </span>
          </button>

          <button
            onClick={() => setViewMode("preview")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              viewMode === "preview"
                ? `bg-white shadow-sm ${
                    isEstablishment ? "text-indigo-600" : "text-amber-600"
                  }`
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

      {/* Content */}
      {isEstablishment ? (
        <div
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 p-8"
          dir="rtl"
        >
          <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
            تفاصيل عقد التأسيس
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Field label="اسم الشركة" value={pdf.company_name} />
            <Field label="عنوان الشركة" value={pdf.company_address} />
            <Field label="نوع الشركة" value={pdf.company_type} />
            <Field label="رأس المال" value={pdf.company_capital} />
            <Field
              label="رقم السجل التجاري"
              value={pdf.commercial_register_number}
            />
            <Field label="تاريخ الموافقة" value={pdf.approval_date} />
            <Field
              label="رقم محضر السجل العقاري"
              value={pdf.real_estate_registry_minutes_number}
            />
            <Field label="مدة الشركة" value={pdf.company_duration} />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                نشاط الشركة
              </label>
              <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                {pdf.company_activity || "غير محدد"}
              </p>
            </div>
          </div>

          {/* Law Reference */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-slate-800 mb-4">
              المرجع القانوني
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="رقم القانون" value={pdf.law_reference?.law_number} />
              <Field label="سنة القانون" value={pdf.law_reference?.law_year} />
            </div>
          </div>

          {/* Articles */}
          <div>
            <h4 className="text-lg font-semibold text-slate-800 mb-4">
              المواد
            </h4>

            <div className="space-y-4">
              {pdf.articles && pdf.articles.length > 0 ? (
                pdf.articles.map((article, index) => (
                  <div
                    key={article.id || index}
                    className="bg-slate-50 p-4 rounded-lg border border-slate-200"
                  >
                    <h5 className="font-medium text-slate-800 mb-2">
                      المادة {article.id}
                    </h5>
                    <p className="text-slate-700">{article.value}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">لا توجد مواد محددة</p>
              )}
            </div>
          </div>
        </div>
      ) : viewMode === "articles" ? (
        <div className="max-w-3xl mx-auto">
          <div
            className={`flex items-center gap-2 mb-4 text-sm ${
              isEstablishment ? "text-indigo-500" : "text-amber-600"
            }`}
          >
            <span className="font-medium">
              اضغط على أي مادة لفتح محادثة حولها
            </span>
          </div>

          <ArticleOverlay
            articles={mockArticles}
            onSelectArticle={onSelectArticle}
            type={pdf.type}
          />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="p-8 space-y-6" dir="rtl">
              {mockArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 rounded-lg border hover:bg-slate-50 cursor-pointer"
                  onClick={() => onSelectArticle(article)}
                >
                  <h4 className="font-bold mb-2">
                    {article.title} - {article.subtitle}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {article.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Small reusable component */
function Field({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
        {value || "غير محدد"}
      </p>
    </div>
  );
}