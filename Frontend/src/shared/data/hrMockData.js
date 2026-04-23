// ─── بيانات الموارد البشرية ────────────────────────────────────────────────────
// بيانات وحدة الموارد البشرية / شؤون الموظفين

export const HR_DEPARTMENTS = [
  { id: 1, name: 'الهندسة',          head: 'أليكس كارتر',    staff: 24, budget: 820000, used: 610000, status: 'نشط'     },
  { id: 2, name: 'تصميم المنتج',     head: 'سارة بنعلي',     staff: 10, budget: 450000, used: 390000, status: 'نشط'     },
  { id: 3, name: 'المالية',          head: 'جيمس أوكافور',   staff: 8,  budget: 310000, used: 175000, status: 'نشط'     },
  { id: 4, name: 'الموارد البشرية',  head: 'ناديا السيد',    staff: 6,  budget: 280000, used: 210000, status: 'نشط'     },
  { id: 5, name: 'التسويق',          head: 'كريس يوين',      staff: 12, budget: 500000, used: 320000, status: 'نشط'     },
  { id: 6, name: 'الشؤون القانونية', head: 'فاطمة الراشد',   staff: 4,  budget: 200000, used: 50000,  status: 'غير نشط' },
];

export const HR_EMPLOYEES = [
  { id: 1,  name: 'أليكس كارتر',   role: 'مهندس رئيسي',          dept: 'الهندسة',          hireDate: '2021-03-15', status: 'نشط',        avatar: 'AC', email: 'alex@corp.io',   phone: '+1 555-0101' },
  { id: 2,  name: 'سارة بنعلي',    role: 'مدير تجربة المستخدم',   dept: 'تصميم المنتج',     hireDate: '2020-07-01', status: 'نشط',        avatar: 'SB', email: 'sara@corp.io',   phone: '+1 555-0102' },
  { id: 3,  name: 'جيمس أوكافور',  role: 'مدير مالي تنفيذي',     dept: 'المالية',          hireDate: '2019-01-20', status: 'نشط',        avatar: 'JO', email: 'james@corp.io',  phone: '+1 555-0103' },
  { id: 4,  name: 'ناديا السيد',   role: 'مدير الموارد البشرية',  dept: 'الموارد البشرية',  hireDate: '2022-05-10', status: 'نشط',        avatar: 'NE', email: 'nadia@corp.io',  phone: '+1 555-0104' },
  { id: 5,  name: 'كريس يوين',     role: 'مسؤول التسويق',        dept: 'التسويق',          hireDate: '2021-11-03', status: 'في إجازة',   avatar: 'CY', email: 'chris@corp.io',  phone: '+1 555-0105' },
  { id: 6,  name: 'فاطمة الراشد',  role: 'مستشار قانوني أول',    dept: 'الشؤون القانونية', hireDate: '2020-09-14', status: 'نشط',        avatar: 'FA', email: 'fatima@corp.io', phone: '+1 555-0106' },
  { id: 7,  name: 'لوكاس فيريرا',  role: 'مهندس واجهات أمامية',  dept: 'الهندسة',          hireDate: '2023-02-28', status: 'نشط',        avatar: 'LF', email: 'lucas@corp.io',  phone: '+1 555-0107' },
  { id: 8,  name: 'ميي تشانغ',     role: 'محلل بيانات',          dept: 'المالية',          hireDate: '2022-08-19', status: 'نشط',        avatar: 'MZ', email: 'mei@corp.io',    phone: '+1 555-0108' },
  { id: 9,  name: 'عمر بكر',       role: 'مهندس خلفية',          dept: 'الهندسة',          hireDate: '2023-06-01', status: 'منتهي العقد', avatar: 'OB', email: 'omar@corp.io',   phone: '+1 555-0109' },
  { id: 10, name: 'بريا ناير',     role: 'مصمم منتج',            dept: 'تصميم المنتج',     hireDate: '2021-12-15', status: 'نشط',        avatar: 'PN', email: 'priya@corp.io',  phone: '+1 555-0110' },
];

export const HR_TASKS = [
  { id: 't1',  title: 'إعادة تصميم شاشة تسجيل الدخول', assignee: 'SB', assigneeName: 'سارة بنعلي',   priority: 'عالية',   deadline: '2026-04-22', stage: 'قيد التنفيذ'   },
  { id: 't2',  title: 'تطبيق البرمجيات الوسيطة للمصادقة', assignee: 'LF', assigneeName: 'لوكاس فيريرا', priority: 'عالية',   deadline: '2026-04-20', stage: 'قيد التنفيذ'   },
  { id: 't3',  title: 'توقعات ميزانية الربع الثاني',    assignee: 'MZ', assigneeName: 'ميي تشانغ',    priority: 'متوسطة',  deadline: '2026-04-30', stage: 'قائمة الانتظار' },
  { id: 't4',  title: 'تحديث حزمة الاستقبال الوظيفي',  assignee: 'NE', assigneeName: 'ناديا السيد',   priority: 'منخفضة',  deadline: '2026-05-10', stage: 'قائمة الانتظار' },
  { id: 't5',  title: 'تدقيق أداء واجهة برمجة التطبيقات', assignee: 'AC', assigneeName: 'أليكس كارتر',  priority: 'عالية',   deadline: '2026-04-21', stage: 'تحت المراجعة'  },
  { id: 't6',  title: 'تحديث دليل الهوية البصرية',     assignee: 'CY', assigneeName: 'كريس يوين',     priority: 'متوسطة',  deadline: '2026-05-05', stage: 'قائمة الانتظار' },
  { id: 't7',  title: 'مراجعة قوالب العقود',           assignee: 'FA', assigneeName: 'فاطمة الراشد',  priority: 'منخفضة',  deadline: '2026-04-28', stage: 'تحت المراجعة'  },
  { id: 't8',  title: 'اختبار التوافق مع الأجهزة المحمولة', assignee: 'PN', assigneeName: 'بريا ناير',    priority: 'متوسطة',  deadline: '2026-04-25', stage: 'مكتمل'         },
  { id: 't9',  title: 'ترحيل مخطط قاعدة البيانات',    assignee: 'AC', assigneeName: 'أليكس كارتر',  priority: 'عالية',   deadline: '2026-04-19', stage: 'مكتمل'         },
  { id: 't10', title: 'تحليلات الحملة على وسائل التواصل', assignee: 'CY', assigneeName: 'كريس يوين',     priority: 'منخفضة',  deadline: '2026-05-15', stage: 'قائمة الانتظار' },
];

export const KANBAN_STAGES = ['قائمة الانتظار', 'قيد التنفيذ', 'تحت المراجعة', 'مكتمل'];

export const HR_DEPT_NAMES = [...new Set(HR_EMPLOYEES.map(e => e.dept))];