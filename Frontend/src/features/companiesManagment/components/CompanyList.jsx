export default function CompanyList({ companies, onSelectCompany }) {
  console.log("Rendering CompanyList with companies:", companies);
  return (
    <div className="animate-fadeIn">
      {/* Title */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">الشركات</h2>
        <p className="text-slate-500">اختر شركة لعرض العقود المتاحة</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => onSelectCompany(company)}
            className="group bg-white rounded-2xl p-6 shadow-md hover:shadow-xl
                       border border-slate-200 hover:border-indigo-300
                       transition-all duration-300 hover:-translate-y-1 text-right
                       cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {company.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
              {company.name}
            </h3>
            <p className="text-sm text-slate-500 mb-4">{company.description}</p>
            <div className="flex gap-4 text-xs text-slate-400">
              <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                تأسيس: {company.establishmentContracts.length}
              </span>
              <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                تعديل: {company.amendmentContracts.length}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}