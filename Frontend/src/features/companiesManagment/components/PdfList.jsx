import ContractCard from "./ContractCard";

export default function PdfList({ contracts, contractType, company, onSelectPdf, onDelete }) {
  const typeLabel = contractType === "establishment" ? "عقود تأسيس" : "عقود تعديل";
  const typeIcon = contractType === "establishment" ? "📋" : "📝";

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
    </div>
  );
}
