export const ledgerRowsSeed = [
  { 
    id: "LGR-EGP-0012", 
    company: "شركة المدار اللوجستية", 
    department: "الضرائب", 
    amount: "1,245,000.00 ج.م", 
    currency: "EGP", 
    status: "قيد المراجعة", 
    postedAt: "2026-04-10" 
  },
  { 
    id: "LGR-SAR-0009", 
    company: "شركة الوسم التجارية ذ.م.م", 
    department: "التأمين", 
    amount: "320,500.00 ر.س", 
    currency: "SAR", 
    status: "معلق", 
    postedAt: "2026-04-09" 
  },
  { 
    id: "LGR-EGP-0008", 
    company: "النيل كوبري للإنشاءات", 
    department: "الشؤون القانونية", 
    amount: "89,300.00 ج.م", 
    currency: "EGP", 
    status: "تم التحقق", 
    postedAt: "2026-04-08" 
  },
  { 
    id: "LGR-SAR-0004", 
    company: "مجموعة رياض موبيليتي", 
    department: "الأرشيف", 
    amount: "27,980.00 ر.س", 
    currency: "SAR", 
    status: "متأخر", 
    postedAt: "2026-04-05" 
  },
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
