// ─── HR Mock Data ─────────────────────────────────────────────────────────────
// Appended to the existing mockData.js — HR/Personnel module data layer

export const HR_DEPARTMENTS = [
  { id: 1, name: 'Engineering',       head: 'Alex Carter',      staff: 24, budget: 820000, used: 610000, status: 'Active' },
  { id: 2, name: 'Product Design',    head: 'Sara Benali',      staff: 10, budget: 450000, used: 390000, status: 'Active' },
  { id: 3, name: 'Finance',           head: 'James Okafor',     staff: 8,  budget: 310000, used: 175000, status: 'Active' },
  { id: 4, name: 'Human Resources',   head: 'Nadia El-Sayed',   staff: 6,  budget: 280000, used: 210000, status: 'Active' },
  { id: 5, name: 'Marketing',         head: 'Chris Yuen',       staff: 12, budget: 500000, used: 320000, status: 'Active' },
  { id: 6, name: 'Legal',             head: 'Fatima Al-Rashid', staff: 4,  budget: 200000, used: 50000,  status: 'Inactive' },
];

export const HR_EMPLOYEES = [
  { id: 1,  name: 'Alex Carter',       role: 'Lead Engineer',    dept: 'Engineering',     hireDate: '2021-03-15', status: 'Active',     avatar: 'AC', email: 'alex@corp.io',   phone: '+1 555-0101' },
  { id: 2,  name: 'Sara Benali',       role: 'UX Director',      dept: 'Product Design',  hireDate: '2020-07-01', status: 'Active',     avatar: 'SB', email: 'sara@corp.io',   phone: '+1 555-0102' },
  { id: 3,  name: 'James Okafor',      role: 'CFO',              dept: 'Finance',         hireDate: '2019-01-20', status: 'Active',     avatar: 'JO', email: 'james@corp.io',  phone: '+1 555-0103' },
  { id: 4,  name: 'Nadia El-Sayed',    role: 'HR Manager',       dept: 'Human Resources', hireDate: '2022-05-10', status: 'Active',     avatar: 'NE', email: 'nadia@corp.io',  phone: '+1 555-0104' },
  { id: 5,  name: 'Chris Yuen',        role: 'Marketing Lead',   dept: 'Marketing',       hireDate: '2021-11-03', status: 'On-Leave',   avatar: 'CY', email: 'chris@corp.io',  phone: '+1 555-0105' },
  { id: 6,  name: 'Fatima Al-Rashid',  role: 'Senior Counsel',   dept: 'Legal',           hireDate: '2020-09-14', status: 'Active',     avatar: 'FA', email: 'fatima@corp.io', phone: '+1 555-0106' },
  { id: 7,  name: 'Lucas Ferreira',    role: 'Frontend Engineer', dept: 'Engineering',    hireDate: '2023-02-28', status: 'Active',     avatar: 'LF', email: 'lucas@corp.io',  phone: '+1 555-0107' },
  { id: 8,  name: 'Mei Zhang',         role: 'Data Analyst',     dept: 'Finance',         hireDate: '2022-08-19', status: 'Active',     avatar: 'MZ', email: 'mei@corp.io',    phone: '+1 555-0108' },
  { id: 9,  name: 'Omar Bakr',         role: 'Backend Engineer', dept: 'Engineering',     hireDate: '2023-06-01', status: 'Terminated', avatar: 'OB', email: 'omar@corp.io',   phone: '+1 555-0109' },
  { id: 10, name: 'Priya Nair',        role: 'Product Designer', dept: 'Product Design',  hireDate: '2021-12-15', status: 'Active',     avatar: 'PN', email: 'priya@corp.io',  phone: '+1 555-0110' },
];

export const HR_TASKS = [
  { id: 't1',  title: 'Redesign Login Flow',       assignee: 'SB', assigneeName: 'Sara Benali',     priority: 'High',   deadline: '2026-04-22', stage: 'In Progress' },
  { id: 't2',  title: 'Implement Auth Middleware',  assignee: 'LF', assigneeName: 'Lucas Ferreira',  priority: 'High',   deadline: '2026-04-20', stage: 'In Progress' },
  { id: 't3',  title: 'Q2 Budget Forecast',         assignee: 'MZ', assigneeName: 'Mei Zhang',       priority: 'Medium', deadline: '2026-04-30', stage: 'Backlog'     },
  { id: 't4',  title: 'Onboarding Pack Update',     assignee: 'NE', assigneeName: 'Nadia El-Sayed',  priority: 'Low',    deadline: '2026-05-10', stage: 'Backlog'     },
  { id: 't5',  title: 'API Performance Audit',      assignee: 'AC', assigneeName: 'Alex Carter',     priority: 'High',   deadline: '2026-04-21', stage: 'Under Review'},
  { id: 't6',  title: 'Brand Guidelines Refresh',   assignee: 'CY', assigneeName: 'Chris Yuen',      priority: 'Medium', deadline: '2026-05-05', stage: 'Backlog'     },
  { id: 't7',  title: 'Contract Template Audit',    assignee: 'FA', assigneeName: 'Fatima Al-Rashid',priority: 'Low',    deadline: '2026-04-28', stage: 'Under Review'},
  { id: 't8',  title: 'Mobile Responsive QA',       assignee: 'PN', assigneeName: 'Priya Nair',      priority: 'Medium', deadline: '2026-04-25', stage: 'Completed'   },
  { id: 't9',  title: 'Database Schema Migration',  assignee: 'AC', assigneeName: 'Alex Carter',     priority: 'High',   deadline: '2026-04-19', stage: 'Completed'   },
  { id: 't10', title: 'Social Campaign Analytics',  assignee: 'CY', assigneeName: 'Chris Yuen',      priority: 'Low',    deadline: '2026-05-15', stage: 'Backlog'     },
];

export const KANBAN_STAGES = ['Backlog', 'In Progress', 'Under Review', 'Completed'];

export const HR_DEPT_NAMES = [...new Set(HR_EMPLOYEES.map(e => e.dept))];
