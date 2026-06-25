import { Building2, FilePenLine, FileText, FolderOpen, Upload } from "lucide-react";

function contractCountLabel(n) {
  if (n === 0) return "لا عقود";
  if (n === 1) return "عقد واحد";
  return `${n} عقود`;
}

function TypeCard({ type, onSelectType }) {
  const Icon = type.icon;

  return (
    <button
      type="button"
      onClick={() => onSelectType(type.key)}
      className="group rounded-lg border border-appBorder bg-appSurface p-5 text-right shadow-panel ui-transition hover:-translate-y-0.5 hover:border-brand/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-appText group-hover:text-brand">{type.label}</h3>
          <p className="mt-2 min-h-[44px] text-sm leading-6 text-appSubtext">{type.description}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${type.iconClass}`}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg border border-appBorder bg-appMuted px-3 py-2">
        <span className="text-xs font-semibold text-appSubtext">المتوفر</span>
        <span className="text-sm font-bold text-appText tabular-nums">{type.countLabel}</span>
      </div>
    </button>
  );
}

function UploadAction({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-appBorder bg-appMuted px-4 text-sm font-bold text-appText shadow-sm ui-transition hover:border-brand/50 hover:bg-brand/10 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      <Upload className="h-4 w-4" aria-hidden="true" />
      رفع ملف جديد
    </button>
  );
}

export default function ContractViewer({ company, onSelectType, onUploadClick }) {
  const otherCount = company.otherContracts?.length ?? 0;
  const establishmentCount = company.establishmentContracts?.length ?? 0;
  const amendmentCount = company.amendmentContracts?.length ?? 0;
  const totalCount = establishmentCount + amendmentCount + otherCount;

  const types = [
    {
      key: "establishment",
      label: "عقود تأسيس",
      icon: FileText,
      iconClass: "bg-badgeBlueBg text-badgeBlueText border-appBorder",
      count: establishmentCount,
      countLabel: contractCountLabel(establishmentCount),
      description: "العقود الأصلية وبيانات التأسيس الخاصة بالشركة.",
    },
    {
      key: "amendment",
      label: "عقود تعديل",
      icon: FilePenLine,
      iconClass: "bg-badgePurpleBg text-badgePurpleText border-appBorder",
      count: amendmentCount,
      countLabel: contractCountLabel(amendmentCount),
      description: "ملفات التعديل والتحديثات المرتبطة بعقد الشركة.",
    },
    {
      key: "other",
      label: "أخرى",
      icon: FolderOpen,
      iconClass: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900",
      count: otherCount,
      countLabel: contractCountLabel(otherCount),
      description: "مستندات وملفات إضافية محفوظة ضمن ملف الشركة.",
    },
  ];

  return (
    <div className="animate-fadeIn space-y-6">
      <section className="rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
              <Building2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand">ملف الشركة</p>
              <h2 className="mt-1 text-2xl font-bold text-appText md:text-3xl">{company.name}</h2>
              <p className="mt-2 text-sm text-appSubtext">{company.description || "نوع الشركة غير محدد"}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:min-w-[320px]">
            <div className="rounded-lg border border-appBorder bg-appMuted px-3 py-2 text-center">
              <p className="text-xl font-bold text-appText tabular-nums">{totalCount}</p>
              <p className="text-[11px] font-semibold text-appSubtext">الإجمالي</p>
            </div>
            <div className="rounded-lg border border-appBorder bg-badgeBlueBg/60 px-3 py-2 text-center">
              <p className="text-xl font-bold text-appText tabular-nums">{establishmentCount}</p>
              <p className="text-[11px] font-semibold text-badgeBlueText">تأسيس</p>
            </div>
            <div className="rounded-lg border border-appBorder bg-badgePurpleBg/60 px-3 py-2 text-center">
              <p className="text-xl font-bold text-appText tabular-nums">{amendmentCount}</p>
              <p className="text-[11px] font-semibold text-badgePurpleText">تعديل</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {types.map((type) => (
          <TypeCard key={type.key} type={type} onSelectType={onSelectType} />
        ))}
      </div>

      <section className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-appBorder bg-appMuted text-brand">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-appText">رفع مستند جديد</h3>
              <p className="text-xs text-appSubtext">سيتم حفظ الملف ضمن الشركة الحالية.</p>
            </div>
          </div>
          <div className="w-full md:w-64">
            <UploadAction onClick={onUploadClick} />
          </div>
        </div>
      </section>
    </div>
  );
}
