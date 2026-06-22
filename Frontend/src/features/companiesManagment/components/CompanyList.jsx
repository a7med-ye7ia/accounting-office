export default function CompanyList({ companies, onSelectCompany, onAddCompany }) {
  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-10 space-y-2">
        <h2 className="text-3xl font-bold text-appText">الشركات</h2>
        <p className="text-appSubtext max-w-xl mx-auto leading-relaxed">
          اختر شركة لعرض العقود المتاحة
        </p>
        {onAddCompany && (
          <button
            type="button"
            onClick={onAddCompany}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white
                       bg-gradient-to-l from-emerald-600 to-indigo-700 shadow-lg shadow-indigo-200/50
                       hover:shadow-xl hover:shadow-indigo-300/60 hover:-translate-y-0.5
                       active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            إضافة شركة
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => onSelectCompany(company)}
            className="group rounded-2xl border border-appBorder bg-appSurface p-6 shadow-panel text-right cursor-pointer ui-transition hover:-translate-y-1 hover:border-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 ui-transition duration-200 ease-out">
              {company.icon}
            </div>
            <h3 className="text-lg font-bold text-appText mb-2 group-hover:text-brand ui-transition">
              {company.name}
            </h3>
            <p className="text-sm text-appSubtext mb-5 leading-relaxed">{company.description}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="bg-badgeBlueBg text-badgeBlueText px-3 py-1.5 rounded-full font-semibold border border-appBorder">
                تأسيس: {company.establishmentContracts.length}
              </span>
              <span className="bg-badgePurpleBg text-badgePurpleText px-3 py-1.5 rounded-full font-semibold border border-appBorder">
                تعديل: {company.amendmentContracts.length}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
