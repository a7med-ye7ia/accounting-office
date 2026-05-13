import UploadCard from "./UploadCard";

export default function ContractViewer({ company, onSelectType, onUploadClick }) {
  const types = [
    {
      key: "establishment",
      label: "عقود تأسيس",
      icon: "📋",
      accent: "blue",
      count: company.establishmentContracts.length,
      description: "عقود التأسيس الأصلية للشركة",
    },
    {
      key: "amendment",
      label: "عقود تعديل",
      icon: "📝",
      accent: "purple",
      count: company.amendmentContracts.length,
      description: "عقود التعديل والتحديثات",
    },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-10 space-y-2">
        <div className="text-5xl mb-2">{company.icon}</div>
        <h2 className="text-3xl font-bold text-appText">{company.name}</h2>
        <p className="text-appSubtext">اختر نوع العقد</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
        {types.map((type) => (
          <button
            key={type.key}
            type="button"
            onClick={() => onSelectType(type.key)}
            className={`group rounded-2xl border-2 border-appBorder bg-appSurface p-8 shadow-panel text-center ui-transition hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              type.accent === "blue"
                ? "hover:border-brand/50"
                : "hover:border-badgePurpleText/40"
            }`}
          >
            <div className="text-6xl mb-4 group-hover:scale-110 ui-transition duration-200 ease-out">
              {type.icon}
            </div>
            <h3 className="text-xl font-bold text-appText mb-2">{type.label}</h3>
            <p className="text-sm text-appSubtext mb-5 leading-relaxed">{type.description}</p>
            <div
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border border-appBorder ${
                type.accent === "blue"
                  ? "bg-badgeBlueBg text-badgeBlueText"
                  : "bg-badgePurpleBg text-badgePurpleText"
              }`}
            >
              {type.count} {type.count === 1 ? "عقد" : "عقود"}
            </div>
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-appBorder" />
          <span className="text-sm text-appSubtext font-medium">أو قم برفع عقد جديد</span>
          <div className="h-px flex-1 bg-appBorder" />
        </div>
        <div className="max-w-xs mx-auto">
          <UploadCard onClick={onUploadClick} />
        </div>
      </div>
    </div>
  );
}
