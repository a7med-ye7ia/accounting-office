import ContractCard from "./ContractCard";
import UploadCard from "./UploadCard";

export default function PdfList({
  contracts = [], // 2. تأمين لو مفيش مصفوفة مبعوتة
  contractType,
  company,
  onSelectPdf,
  onDelete,
  onUploadClick,
  onCreateAiClick,
}) {
  if (!company) return null;

  const typeLabel =
    contractType === "establishment"
      ? "عقود تأسيس"
      : contractType === "amendment"
        ? "عقود تعديل"
        : "عقود وملفات أخرى";
  const typeIcon =
    contractType === "establishment"
      ? "📋"
      : contractType === "amendment"
        ? "📝"
        : "📁";

  const enrichedContracts = contracts.map((c) => ({
    ...c,
    type: c.type || contractType,
  }));

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-10 space-y-2">
        <div className="text-4xl">{typeIcon}</div>
        <h2 className="text-3xl font-bold text-appText">{typeLabel}</h2>
        <p className="text-appSubtext">{company.name}</p>
      </div>

      {enrichedContracts.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-appBorder bg-appSurface shadow-panel max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-4 bg-appMuted rounded-2xl flex items-center justify-center border border-appBorder">
            <svg
              className="w-10 h-10 text-appSubtext"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-appText mb-2">لا توجد عقود</h3>
          <p className="text-sm text-appSubtext px-6">لم يتم إضافة أي عقود بعد لهذا القسم</p>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {enrichedContracts.map((contract, index) => (
          <div
            key={contract.id}
            className="animate-fadeIn"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <ContractCard contract={contract} onDelete={onDelete} onEdit={onSelectPdf} />
          </div>
        ))}
      </div>

      {/* منطقة الرفع والـ AI الديناميكية */}
      <div className="max-w-4xl mx-auto mt-10 px-4 pb-10">
        {/* العنوان الجانبي */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm text-slate-400 font-medium text-center">
            {contractType === "amendment"
              ? "خيارات الإضافة والتعديل الذكي"
              : "قم برفع ملف جديد"}
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* الحاوية اللي شايلاهم جنب بعض */}
        <div
          className={`grid gap-4 justify-items-center ${
            contractType === "amendment"
              ? "grid-cols-1 md:grid-cols-2"
              : "grid-cols-1"
          }`}
        >
          {/* كارت الرفع الأساسي */}
          <div className="w-full max-w-xs">
            <UploadCard onClick={onUploadClick} />
          </div>

          {/* كارت الـ AI المخطط باللون البنفسجي */}
          {contractType === "amendment" && onCreateAiClick && (
            <div className="w-full max-w-xs">
              <button
                type="button"
                onClick={onCreateAiClick}
                className="group relative w-full h-52 rounded-2xl
                     border-2 border-dashed border-purple-300
                     hover:border-purple-500 hover:bg-purple-50/50
                     bg-white flex flex-col items-center justify-center gap-3
                     transition-all duration-300 hover:scale-[1.02] hover:shadow-lg
                     cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                {/* الأيقونة البنفسجية */}
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <svg
                    className="w-7 h-7 text-purple-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1-1-3 1 1-3-1-1 3-.75M14 7h.01M6 13a8 8 0 1111.314 0L12 18.314 6.686 13A7.963 7.963 0 016 13z"
                    />
                  </svg>
                </div>

                {/* النصوص */}
                <div className="text-center px-4">
                  <span className="block text-sm font-bold text-purple-700 mb-1">
                    Create Amendment using AI
                  </span>
                  <span className="block text-[11px] text-slate-400 leading-tight">
                    إنشاء تعديل بالذكاء الاصطناعي <br /> اختر مادة واكتب
                    تعليماتك
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
