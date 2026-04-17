import ContractCard from "./ContractCard";

export default function PdfList({
  contracts,
  contractType,
  company,
  onSelectPdf,
  onDelete
}) {
  const typeLabel = contractType === "establishment" ? "عقود تأسيس" : "عقود تعديل";
  const typeIcon = contractType === "establishment" ? "📋" : "📝";

  // Enrich contracts with type (mock contracts don't have it)
  const enrichedContracts = contracts.map((c) => ({
    ...c,
    type: c.type || contractType,
  }));

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">{typeIcon}</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-1">{typeLabel}</h2>
        <p className="text-slate-500">{company.name}</p>
      </div>

      {/* Empty State */}
      {enrichedContracts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-slate-300"
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
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            لا توجد عقود
          </h3>
          <p className="text-sm text-slate-400">
            لم يتم إضافة أي عقود بعد لهذا القسم
          </p>
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
            <ContractCard
              contract={contract}
              onDelete={onDelete}
              onEdit={onSelectPdf}
            />
          </div>
        ))}
      </div>
    </div>
  );
}