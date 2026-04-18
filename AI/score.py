<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Global Logistics Inc. - Architectural Ledger</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary-dim": "#1a4ea8",
                        "surface-container-high": "#e1e9ee",
                        "primary-fixed-dim": "#c5d4ff",
                        "secondary-fixed-dim": "#c1d8e4",
                        "secondary-fixed": "#cfe6f2",
                        "error": "#9f403d",
                        "outline-variant": "#a9b4b9",
                        "outline": "#717c82",
                        "on-surface": "#2a3439",
                        "on-tertiary-fixed-variant": "#5b5672",
                        "tertiary-fixed-dim": "#d4cdee",
                        "surface-container-lowest": "#ffffff",
                        "on-primary": "#f7f7ff",
                        "tertiary-fixed": "#e2dbfd",
                        "background": "#f7f9fb",
                        "on-tertiary": "#fcf7ff",
                        "inverse-primary": "#759efd",
                        "on-primary-fixed-variant": "#2858b2",
                        "primary-container": "#d9e2ff",
                        "on-background": "#2a3439",
                        "on-error": "#fff7f6",
                        "surface-variant": "#d9e4ea",
                        "error-container": "#fe8983",
                        "on-secondary-container": "#40555f",
                        "on-primary-container": "#194da7",
                        "on-error-container": "#752121",
                        "on-secondary-fixed": "#2d424c",
                        "tertiary-dim": "#54506b",
                        "on-tertiary-fixed": "#3e3a54",
                        "on-tertiary-container": "#514d68",
                        "surface-bright": "#f7f9fb",
                        "tertiary-container": "#e2dbfd",
                        "surface-container-highest": "#d9e4ea",
                        "on-secondary-fixed-variant": "#495f69",
                        "surface-tint": "#2b5bb5",
                        "on-surface-variant": "#566166",
                        "error-dim": "#4e0309",
                        "inverse-surface": "#0b0f10",
                        "inverse-on-surface": "#9a9d9f",
                        "surface-container": "#e8eff3",
                        "surface": "#f7f9fb",
                        "secondary": "#4d626c",
                        "surface-container-low": "#f0f4f7",
                        "tertiary": "#605c78",
                        "primary-fixed": "#d9e2ff",
                        "secondary-container": "#cfe6f2",
                        "secondary-dim": "#415660",
                        "on-secondary": "#f2faff",
                        "surface-dim": "#cfdce3",
                        "on-primary-fixed": "#003b8d",
                        "primary": "#2b5bb5"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "fontFamily": {
                        "headline": ["Manrope"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    }
                }
            }
        }
    </script>
<style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4 { font-family: 'Manrope', sans-serif; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="bg-surface text-on-surface">
<!-- SideNavBar Shell -->
<aside class="h-screen w-64 fixed left-0 top-0 border-r-0 bg-slate-50 dark:bg-slate-900 flex flex-col py-6 z-50">
<div class="px-6 mb-8">
<h1 class="text-xl font-bold text-blue-900 dark:text-blue-100 uppercase tracking-widest font-headline">Architectural Ledger</h1>
<p class="text-xs text-slate-500 font-label tracking-wider mt-1">Accounting Management</p>
</div>
<nav class="flex-1 flex flex-col gap-1">
<a class="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 pl-5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span class="text-sm font-label uppercase tracking-widest">Dashboard</span>
</a>
<!-- Active State: Companies -->
<a class="flex items-center gap-3 py-3 text-blue-700 dark:text-blue-400 font-semibold border-l-4 border-blue-700 dark:border-blue-400 pl-4 bg-slate-100 dark:bg-slate-800 transition-all scale-98" href="#">
<span class="material-symbols-outlined" data-icon="business">business</span>
<span class="text-sm font-label uppercase tracking-widest">Companies</span>
</a>
<a class="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 pl-5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="description">description</span>
<span class="text-sm font-label uppercase tracking-widest">Documents</span>
</a>
<a class="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 pl-5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="group">group</span>
<span class="text-sm font-label uppercase tracking-widest">Employees</span>
</a>
<a class="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 pl-5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="assignment">assignment</span>
<span class="text-sm font-label uppercase tracking-widest">Employee Tasks</span>
</a>
<a class="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 pl-5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="account_tree">account_tree</span>
<span class="text-sm font-label uppercase tracking-widest">Departments</span>
</a>
<a class="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 pl-5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="contract">contract</span>
<span class="text-sm font-label uppercase tracking-widest">Contracts</span>
</a>
</nav>
<div class="px-6 mb-6">
<button class="w-full bg-primary text-on-primary py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-primary-dim transition-colors">
<span class="material-symbols-outlined" data-icon="add">add</span>
<span class="font-label tracking-widest text-xs uppercase">New Entry</span>
</button>
</div>
<div class="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-col gap-1">
<a class="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 pl-5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="text-sm font-label uppercase tracking-widest">Settings</span>
</a>
<a class="flex items-center gap-3 py-3 text-slate-500 dark:text-slate-400 pl-5 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="help">help</span>
<span class="text-sm font-label uppercase tracking-widest">Support</span>
</a>
</div>
</aside>
<!-- TopNavBar Shell -->
<header class="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm flex justify-between items-center px-8">
<div class="flex items-center gap-4 flex-1">
<div class="relative w-full max-w-md focus-within:ring-2 focus-within:ring-blue-500 rounded-lg">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" data-icon="search">search</span>
<input class="w-full bg-surface-container-low border-none rounded-lg pl-10 py-2 text-sm focus:ring-0" placeholder="Search accounts, companies, or records..." type="text"/>
</div>
</div>
<div class="flex items-center gap-6">
<div class="flex items-center gap-4 text-slate-600 dark:text-slate-400">
<button class="hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button class="hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
<span class="material-symbols-outlined" data-icon="chat_bubble">chat_bubble</span>
</button>
<button class="hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
<span class="material-symbols-outlined" data-icon="help">help</span>
</button>
</div>
<div class="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
<button class="flex items-center gap-2 group">
<img alt="User Profile" class="w-10 h-10 rounded-full object-cover border-2 border-surface-container-high group-hover:border-primary transition-all" data-alt="Professional headshot of a financial manager in a clean studio setting with neutral lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqwhXQqJA6KGSM9Lo4oTVPHdgGPu7OosBEf4b0sVmlwoBtu39GkWtdw2wLxntBn3MEyLSp9xsLWlrJaiHqCF0EQM5ngDdssl9SbiVRObV6kP8cpy2l1pSY8lyh2pLL26nkiUsWOtOqO-2sqkvEG8MfnMFoJVNzUcFYQLCU0Sar2VwddC9LkPsefTCu3ebuNAcC38J7UycEUsWRr04WRGqBnHdOKyJ3-PDJNqBX375PVUCpskAOSA1N9RhtdJUO1u_xScW6jh-azPw"/>
<div class="hidden lg:block text-left">
<p class="text-sm font-bold leading-none">Marcus Verity</p>
<p class="text-[10px] text-on-surface-variant font-label uppercase tracking-tighter">Sr. Auditor</p>
</div>
</button>
</div>
</header>
<!-- Main Canvas -->
<main class="ml-64 pt-24 px-8 pb-12 min-h-screen">
<!-- Page Header -->
<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
<div>
<nav class="flex items-center gap-2 text-xs font-label uppercase tracking-widest text-on-surface-variant mb-4">
<a class="hover:text-primary" href="#">Companies</a>
<span class="material-symbols-outlined text-[14px]" data-icon="chevron_right">chevron_right</span>
<span class="text-primary font-bold">Global Logistics Inc.</span>
</nav>
<h1 class="text-5xl font-extrabold tracking-tight text-on-surface font-headline mb-2">Global Logistics Inc.</h1>
<p class="text-on-surface-variant max-w-2xl font-body">Multinational freight and supply chain infrastructure partner. Managing core logistics ledger since Q3 2019.</p>
</div>
<div class="flex gap-3">
<button class="px-6 py-2 bg-surface-container-highest text-on-surface text-sm font-bold rounded hover:bg-surface-container-high transition-all">
                    Generate Report
                </button>
<button class="px-6 py-2 bg-gradient-to-br from-primary to-primary-dim text-on-primary text-sm font-bold rounded shadow-sm hover:shadow-md transition-all">
                    Edit Profile
                </button>
</div>
</div>
<!-- Internal Sub-Navigation (Tabs) -->
<div class="flex items-center gap-8 mb-8 border-b-0">
<button class="pb-4 border-b-2 border-primary text-on-primary-fixed-variant font-bold text-sm flex items-center gap-2">
<span class="material-symbols-outlined text-sm" data-icon="grid_view">grid_view</span>
                Overview
            </button>
<button class="pb-4 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface transition-all font-medium text-sm flex items-center gap-2">
<span class="material-symbols-outlined text-sm" data-icon="folder">folder</span>
                Documents
            </button>
<button class="pb-4 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface transition-all font-medium text-sm flex items-center gap-2">
<span class="material-symbols-outlined text-sm" data-icon="history_edu">history_edu</span>
                Contracts
            </button>
<button class="pb-4 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface transition-all font-medium text-sm flex items-center gap-2">
<span class="material-symbols-outlined text-sm" data-icon="monitoring">monitoring</span>
                Activity History
            </button>
</div>
<!-- Content Grid (Bento Style) -->
<div class="grid grid-cols-12 gap-6">
<!-- Quick Stats Card -->
<div class="col-span-12 lg:col-span-8 grid grid-cols-3 gap-6">
<div class="col-span-1 bg-surface-container-lowest p-6 rounded-xl border-none shadow-[0_10px_30px_-5px_rgba(42,52,57,0.04)]">
<p class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Current Balance</p>
<h3 class="text-3xl font-extrabold text-primary font-headline">$2,412,080</h3>
<div class="mt-4 flex items-center gap-2 text-xs font-bold text-secondary">
<span class="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
                        +12.4% vs LY
                    </div>
</div>
<div class="col-span-1 bg-surface-container-lowest p-6 rounded-xl border-none shadow-[0_10px_30px_-5px_rgba(42,52,57,0.04)]">
<p class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Active Contracts</p>
<h3 class="text-3xl font-extrabold text-on-surface font-headline">14</h3>
<div class="mt-4 flex items-center gap-2 text-xs font-bold text-on-surface-variant">
<span class="material-symbols-outlined text-sm" data-icon="verified">verified</span>
                        All Compliant
                    </div>
</div>
<div class="col-span-1 bg-surface-container-lowest p-6 rounded-xl border-none shadow-[0_10px_30px_-5px_rgba(42,52,57,0.04)]">
<p class="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Last Audit</p>
<h3 class="text-3xl font-extrabold text-on-surface font-headline">Oct 24</h3>
<div class="mt-4 flex items-center gap-2 text-xs font-bold text-error">
<span class="material-symbols-outlined text-sm" data-icon="event_busy">event_busy</span>
                        Next in 12 days
                    </div>
</div>
<!-- Main Overview Visual -->
<div class="col-span-3 bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden">
<div class="relative z-10">
<h4 class="text-xl font-bold mb-6">Financial Distribution</h4>
<div class="flex items-end gap-1 h-48 mb-6">
<div class="bg-primary/10 w-full h-[60%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative">
<div class="absolute -top-10 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] px-2 py-1 rounded hidden group-hover:block">$450k</div>
</div>
<div class="bg-primary/10 w-full h-[40%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative"></div>
<div class="bg-primary/20 w-full h-[85%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative"></div>
<div class="bg-primary/10 w-full h-[30%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative"></div>
<div class="bg-primary/40 w-full h-[70%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative"></div>
<div class="bg-primary w-full h-[95%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative"></div>
<div class="bg-primary/20 w-full h-[55%] rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative"></div>
</div>
<div class="flex justify-between text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
<span>April</span>
<span>May</span>
<span>June</span>
<span>July</span>
<span>August</span>
<span>September</span>
<span>October</span>
</div>
</div>
<!-- Aesthetic texture -->
<div class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
</div>
</div>
<!-- Company Info Panel -->
<div class="col-span-12 lg:col-span-4 space-y-6">
<div class="bg-surface-container-low p-6 rounded-xl">
<h4 class="text-sm font-label uppercase tracking-widest text-on-surface-variant mb-6">Registry Details</h4>
<div class="space-y-6">
<div>
<p class="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Legal Name</p>
<p class="text-sm font-bold">Global Logistics Solutions Inc.</p>
</div>
<div>
<p class="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Tax ID / EIN</p>
<p class="text-sm font-bold">45-92019485-K</p>
</div>
<div>
<p class="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Global HQ</p>
<p class="text-sm font-bold">1200 Maritime Way, Rotterdam, NL</p>
</div>
<div>
<p class="text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Industry Classification</p>
<div class="mt-2 inline-flex items-center px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded-full uppercase tracking-widest">
                                Transportation
                            </div>
</div>
</div>
</div>
<div class="bg-surface-container-lowest p-6 rounded-xl shadow-[0_10px_30px_-5px_rgba(42,52,57,0.04)]">
<h4 class="text-sm font-label uppercase tracking-widest text-on-surface-variant mb-6">Primary Contact</h4>
<div class="flex items-center gap-4">
<img alt="Contact" class="w-12 h-12 rounded-full object-cover" data-alt="Professional portrait of a female executive in a modern office with natural light" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7MAaLzXot6ggITc6PaxshwSIJZYvD1vtfw9eKxeE96_8cWTwoBM3W3MG0tP5QdPSPe6EKDXWj7j5556spyK5t1i_p_t-FqvAiPVU7TW8JPrXPOa7IGLk4GqdyDiB1j1zLV7XCpHGpdT93bNgx0ZJXxxHuGmdEd2EeCU96pD7g7w7fWcMY3-St-Plq1tLeAzi2Tg3-2vvbtyLIpiEEG58snPeWAedrHADhp3peBZrCZZG0b5PdFGTvabL9FqqhY1ykj0NumoHSwLI"/>
<div>
<p class="text-sm font-bold">Sarah Jenkins</p>
<p class="text-xs text-on-surface-variant">Director of Finance</p>
</div>
<button class="ml-auto text-primary">
<span class="material-symbols-outlined" data-icon="mail">mail</span>
</button>
</div>
</div>
</div>
<!-- Recent Activity Table Section -->
<div class="col-span-12">
<div class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_10px_30px_-5px_rgba(42,52,57,0.04)]">
<div class="px-8 py-6 border-b border-surface-container flex justify-between items-center">
<h4 class="text-lg font-bold">Pending Ledger Approvals</h4>
<button class="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                            View All History
                            <span class="material-symbols-outlined text-[16px]" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
<table class="w-full text-left border-collapse">
<thead>
<tr class="bg-surface-container-low">
<th class="px-8 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Reference ID</th>
<th class="px-8 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Description</th>
<th class="px-8 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest text-right">Value (USD)</th>
<th class="px-8 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Date</th>
<th class="px-8 py-4 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">Status</th>
<th class="px-8 py-4"></th>
</tr>
</thead>
<tbody>
<tr class="hover:bg-surface-container-low transition-colors">
<td class="px-8 py-5 text-sm font-bold">TRX-94821</td>
<td class="px-8 py-5 text-sm text-on-surface">Ocean Freight - Port Fees Rebillable</td>
<td class="px-8 py-5 text-sm font-bold text-right font-headline">$12,450.00</td>
<td class="px-8 py-5 text-sm text-on-surface-variant">Oct 24, 2023</td>
<td class="px-8 py-5">
<span class="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-full uppercase tracking-widest">
                                        Pending Review
                                    </span>
</td>
<td class="px-8 py-5 text-right">
<button class="text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined" data-icon="more_vert">more_vert</span></button>
</td>
</tr>
<tr class="bg-surface-container-low/30 hover:bg-surface-container-low transition-colors">
<td class="px-8 py-5 text-sm font-bold">TRX-94820</td>
<td class="px-8 py-5 text-sm text-on-surface">Annual Storage Contract - Warehouse A</td>
<td class="px-8 py-5 text-sm font-bold text-right font-headline">$245,000.00</td>
<td class="px-8 py-5 text-sm text-on-surface-variant">Oct 23, 2023</td>
<td class="px-8 py-5">
<span class="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded-full uppercase tracking-widest">
                                        Verified
                                    </span>
</td>
<td class="px-8 py-5 text-right">
<button class="text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined" data-icon="more_vert">more_vert</span></button>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors">
<td class="px-8 py-5 text-sm font-bold">TRX-94819</td>
<td class="px-8 py-5 text-sm text-on-surface">Customs Brokerage - Entry 445</td>
<td class="px-8 py-5 text-sm font-bold text-right font-headline">$1,200.00</td>
<td class="px-8 py-5 text-sm text-on-surface-variant">Oct 22, 2023</td>
<td class="px-8 py-5">
<span class="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-[10px] font-bold rounded-full uppercase tracking-widest">
                                        Verified
                                    </span>
</td>
<td class="px-8 py-5 text-right">
<button class="text-on-surface-variant hover:text-primary"><span class="material-symbols-outlined" data-icon="more_vert">more_vert</span></button>
</td>
</tr>
</tbody>
</table>
</div>
</div>
</div>
</main>
<!-- FAB for Company Screen -->
<button class="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-full shadow-[0_10px_30px_-5px_rgba(42,52,57,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
<span class="material-symbols-outlined" data-icon="add" style="font-variation-settings: 'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 24;">add</span>
</button>
</body></html>