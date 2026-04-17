import UploadCard from "./UploadCard";

export default function ContractViewer({ company, onSelectType, onUploadClick }) {
  const types = [
    {
      key: "establishment",
      label: "عقود تأسيس",
      icon: "📋",
      color: "indigo",
      count: company.establishmentContracts.length,
      description: "عقود التأسيس الأصلية للشركة",
    },
    {
      key: "amendment",
      label: "عقود تعديل",
      icon: "📝",
      color: "amber",
      count: company.amendmentContracts.length,
      description: "عقود التعديل والتحديثات",
    },
  ];

  return (
    <div className="animate-fadeIn">
      {/* Company Header */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">{company.icon}</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {company.name}
        </h2>
        <p className="text-slate-500">اختر نوع العقد</p>
      </div>

      {/* Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {types.map((type) => (
          <button
            key={type.key}
            onClick={() => onSelectType(type.key)}
            className={`group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl
                       border-2 border-slate-200
                       ${type.color === "indigo" ? "hover:border-indigo-400" : "hover:border-amber-400"}
                       transition-all duration-300 hover:-translate-y-2
                       cursor-pointer focus:outline-none focus:ring-2
                       ${type.color === "indigo" ? "focus:ring-indigo-400" : "focus:ring-amber-400"}`}
          >
            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {type.icon}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {type.label}
            </h3>
            <p className="text-sm text-slate-500 mb-4">{type.description}</p>
            <div
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                type.color === "indigo"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {type.count} {type.count === 1 ? "عقد" : "عقود"}
            </div>
          </button>
        ))}
      </div>

      {/* Upload Card */}
      <div className="max-w-2xl mx-auto mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm text-slate-400 font-medium">
            أو قم برفع عقد جديد
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="max-w-xs mx-auto">
          <UploadCard onClick={onUploadClick} />
        </div>
      </div>
    </div>
  );
}