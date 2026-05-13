import UploadCard from "./UploadCard";

function contractCountLabel(n) {
  if (n === 0) return "لا عقود";
  if (n === 1) return "عقد واحد";
  return `${n} عقود`;
}

export default function ContractViewer({ company, onSelectType, onUploadClick }) {
  const otherCount = company.otherContracts?.length ?? 0;

  const types = [
    {
      key: "establishment",
      label: "عقود تأسيس",
      icon: "📋",
      accent: "blue",
      count: company.establishmentContracts.length,
      countLabel: contractCountLabel(company.establishmentContracts.length),
      description: "عقود التأسيس الأصلية للشركة",
    },
    {
      key: "amendment",
      label: "عقود تعديل",
      icon: "📝",
      accent: "purple",
      count: company.amendmentContracts.length,
      countLabel: contractCountLabel(company.amendmentContracts.length),
      description: "عقود التعديل والتحديثات",
    },
    {
      key: "other",
      label: "اخرى",
      icon: "📁",
      color: "emerald",
      count: otherCount,
      countLabel: contractCountLabel(otherCount),
      description: "عقود وملفات أخرى",
    },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">{company.icon}</div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {company.name}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {types.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => onSelectType(type.key)}
            className={`group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl
              border-2 border-slate-200 transition-all duration-300 hover:-translate-y-2
              ${type.color === "indigo" ? "hover:border-indigo-400" :
                type.color === "amber" ? "hover:border-amber-400" : "hover:border-emerald-400"}`}
          >
            <div className="text-6xl mb-4 group-hover:scale-110 ui-transition duration-200 ease-out">
              {type.icon}
            </div>
            <h3 className="text-xl font-bold text-appText mb-2">{type.label}</h3>
            <p className="text-sm text-appSubtext mb-5 leading-relaxed">{type.description}</p>
            <div
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold
              ${type.color === "indigo" ? "bg-indigo-100 text-indigo-700" :
                type.color === "amber" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
            >
              {type.countLabel}
            </div>
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm text-slate-400 font-medium">
            قم برفع عقد جديد
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
