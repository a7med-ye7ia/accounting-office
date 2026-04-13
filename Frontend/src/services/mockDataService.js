export const ledgerRowsSeed = [
  { id: "LGR-EGP-0012", company: "شركة المدار اللوجستية", department: "Taxes", amount: "EGP 1,245,000.00", currency: "EGP", status: "Reviewing", postedAt: "2026-04-10" },
  { id: "LGR-SAR-0009", company: "Al Wasm Trading LLC", department: "Insurance", amount: "SAR 320,500.00", currency: "SAR", status: "Pending", postedAt: "2026-04-09" },
  { id: "LGR-EGP-0008", company: "Nile Bridge Construction", department: "Legal", amount: "EGP 89,300.00", currency: "EGP", status: "Verified", postedAt: "2026-04-08" },
  { id: "LGR-SAR-0004", company: "Riyadh Mobility Group", department: "Archive", amount: "SAR 27,980.00", currency: "SAR", status: "Overdue", postedAt: "2026-04-05" },
];

export const arabicContractClausesSeed = [
  {
    id: "rent",
    title: "البند الثالث: القيمة الإيجارية",
    body: "يلتزم المستأجر بسداد قيمة إيجارية شهرية مقدارها 75,000 جنيه مصري، وتزاد القيمة سنوياً بنسبة 5% وفقاً لمؤشر التضخم المعتمد.",
  },
  {
    id: "term",
    title: "البند الرابع: مدة العقد",
    body: "تبدأ مدة هذا العقد من تاريخ التوقيع ولمدة ثلاث سنوات ميلادية قابلة للتجديد باتفاق الطرفين كتابياً قبل انتهاء المدة بثلاثين يوماً.",
  },
  {
    id: "liability",
    title: "البند التاسع: المسؤولية والتعويض",
    body: "يتحمل المستأجر المسؤولية الكاملة عن الأضرار الناتجة عن سوء الاستخدام، ويلتزم بتعويض المؤجر عن أي خسائر مباشرة مثبتة بمستندات رسمية.",
  },
];

export function fetchLedgerRows() {
  return Promise.resolve(ledgerRowsSeed);
}

export function fetchArabicContractClauses() {
  return Promise.resolve(arabicContractClausesSeed);
}
