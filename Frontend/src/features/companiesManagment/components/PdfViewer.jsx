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
        <h2 className="text-2xl font-bold text-slate-800 mb-1">{pdf.name}</h2>
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
                ? `bg-white shadow-sm ${isEstablishment ? "text-indigo-600" : "text-amber-600"}`
                : "text-slate-500 hover:text-slate-700"
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
            onClick={() => setViewMode("preview")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              viewMode === "preview"
                ? `bg-white shadow-sm ${isEstablishment ? "text-indigo-600" : "text-amber-600"}`
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              معاينة المستند
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "articles" ? (
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-center gap-2 mb-4 text-sm ${isEstablishment ? "text-indigo-500" : "text-amber-600"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">اضغط على أي مادة لفتح محادثة حولها</span>
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
            {/* PDF Header Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className={`w-4 h-4 ${isEstablishment ? "text-indigo-500" : "text-amber-500"}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <span>{pdf.name}.pdf</span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>

            {/* PDF Body */}
            <div className="p-8 space-y-6" dir="rtl">
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                   {isEstablishment ? "عقد تأسيس شركة" : "عقد تعديل شركة"}
                </h2>
                <h3 className="text-lg text-slate-600">{company.name}</h3>
                <div className={`w-24 h-1 mx-auto mt-4 rounded-full ${isEstablishment ? "bg-indigo-500" : "bg-amber-500"}`}></div>
              </div>

              {mockArticles.map((article) => (
                <div
                  key={article.id}
                  className={`group relative p-4 rounded-lg border-2 border-transparent transition-all duration-300 cursor-pointer
                             ${isEstablishment 
                               ? "hover:border-indigo-300 hover:bg-indigo-50/50" 
                               : "hover:border-amber-300 hover:bg-amber-50/50"}`}
                  onClick={() => onSelectArticle(article)}
                >
                  <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className={`text-white text-[10px] px-2 py-1 rounded-full shadow font-bold ${isEstablishment ? "bg-indigo-600" : "bg-amber-600"}`}>
                      اضغط للمحادثة
                    </div>
                  </div>
                  <h4 className={`font-bold mb-2 ${isEstablishment ? "text-indigo-900" : "text-amber-900"}`}>
                    {article.title} - {article.subtitle}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
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