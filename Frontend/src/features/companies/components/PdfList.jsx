import { Eye, FilePlus2, FileText, FolderOpen, Sparkles, Trash2, Upload } from "lucide-react";
import { getContractTypeMeta } from "../services/companyWorkflow";

const TYPE_ICONS = {
  establishment: FileText,
  amendment: FilePlus2,
  other: FolderOpen,
};

const TYPE_STYLES = {
  establishment: {
    badge: "bg-badgeBlueBg text-badgeBlueText border-appBorder",
    icon: "bg-badgeBlueBg/80 text-badgeBlueText",
  },
  amendment: {
    badge: "bg-badgePurpleBg text-badgePurpleText border-appBorder",
    icon: "bg-badgePurpleBg/80 text-badgePurpleText",
  },
  other: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900",
    icon: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200",
  },
};

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

function EmptyContracts({ meta }) {
  return (
    <div className="rounded-lg border border-dashed border-appBorder bg-appSurface p-8 text-center shadow-panel">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-appBorder bg-appMuted text-appSubtext">
        <FolderOpen className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-bold text-appText">{meta.emptyLabel}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-appSubtext">
        يمكنك رفع ملف جديد ليظهر ضمن هذا القسم.
      </p>
    </div>
  );
}

function ContractCard({ contract, onDelete, onOpen }) {
  const meta = getContractTypeMeta(contract.type);
  const styles = TYPE_STYLES[contract.type] || TYPE_STYLES.other;

  return (
    <article className="group rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel ui-transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-raise-hover">
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${styles.badge}`}>
          {meta.shortLabel}
        </span>
        {contract.date && <span className="text-xs text-appSubtext">{contract.date}</span>}
      </div>

      <button
        type="button"
        onClick={() => onOpen?.(contract)}
        className="mt-5 flex w-full flex-col items-center rounded-lg border border-transparent p-2 text-center ui-transition hover:border-appBorder hover:bg-appMuted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <div className={`flex h-20 w-16 flex-col items-center justify-center rounded-lg ${styles.icon} ui-transition group-hover:scale-105`}>
          <FileText className="mb-1 h-8 w-8" aria-hidden="true" />
          <span className="text-[10px] font-bold">PDF</span>
        </div>
        <h4 className="mt-4 min-h-[40px] text-sm font-bold leading-snug text-appText line-clamp-2">
          {contract.name}
        </h4>
        {contract.size && <p className="mt-1 text-xs text-appSubtext">{contract.size}</p>}
      </button>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-appBorder pt-3">
        <button
          type="button"
          onClick={() => onOpen?.(contract)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-appBorder bg-appMuted text-xs font-bold text-appText ui-transition hover:border-brand/40 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
          عرض
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(contract)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-danger/20 bg-danger/10 text-xs font-bold text-danger ui-transition hover:bg-danger hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          حذف
        </button>
      </div>
    </article>
  );
}

export default function PdfList({
  contracts = [],
  contractType,
  company,
  onSelectPdf,
  onDelete,
  onUploadClick,
  onCreateAiClick,
}) {
  if (!company) return null;

  const meta = getContractTypeMeta(contractType);
  const HeaderIcon = TYPE_ICONS[contractType] || FolderOpen;
  const enrichedContracts = contracts.map((contract) => ({
    ...contract,
    type: contract.type || contractType,
  }));

  return (
    <div className="animate-fadeIn space-y-6">
      <section className="rounded-lg border border-appBorder bg-appSurface p-5 shadow-panel md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-appBorder bg-appMuted text-brand">
              <HeaderIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand">{company.name}</p>
              <h2 className="mt-1 text-2xl font-bold text-appText md:text-3xl">{meta.label}</h2>
              <p className="mt-2 text-sm text-appSubtext">
                {enrichedContracts.length === 1
                  ? "ملف واحد متاح"
                  : `${enrichedContracts.length} ملفات متاحة`}
              </p>
            </div>
          </div>

          <div className="w-full md:w-64">
            <UploadAction onClick={onUploadClick} />
          </div>
        </div>
      </section>

      {enrichedContracts.length === 0 ? (
        <EmptyContracts meta={meta} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {enrichedContracts.map((contract, index) => (
            <div
              key={contract.id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <ContractCard contract={contract} onDelete={onDelete} onOpen={onSelectPdf} />
            </div>
          ))}
        </div>
      )}

      {contractType === "amendment" && onCreateAiClick && (
        <section className="rounded-lg border border-appBorder bg-appSurface p-4 shadow-panel">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-badgePurpleText/20 bg-badgePurpleBg text-badgePurpleText">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-appText">إنشاء تعديل بالذكاء الاصطناعي</h3>
                <p className="text-xs text-appSubtext">اختر المواد واكتب تعليمات التعديل ثم راجع ملف PDF قبل اعتماده.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCreateAiClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-badgePurpleText/20 bg-badgePurpleBg px-4 text-sm font-bold text-badgePurpleText ui-transition hover:border-badgePurpleText/40 hover:bg-badgePurpleBg/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              إنشاء تعديل
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
