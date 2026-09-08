# Accounting Office Management System — Project Documentation (PROJECT_DOCUMENTATION.md)

> Generated from a full inspection of this repository. Everything below reflects the code
> **as it exists right now**. Where a statement could not be confirmed from the code it is
> marked **"Requires verification"**; where a rule is derived from implementation rather than
> explicit docs it is marked **"Implementation-derived rule."**
> Secrets (DB password, JWT secret, mail password, API keys) are deliberately masked.

---

# 1. Project Overview

## What is this system?

A full-stack **Arabic (RTL) office-management platform** for an Egyptian accounting/law office
(frontend app title: **CLARA**). It manages:

- **Companies** (شركات) — with two parallel modules: an older OCR-document browser
  (`/companies`, feature folder `features/companies/`) and a newer contract-workflow module
  (`/companies2`, feature folder `features/companies2/`).
- **Contracts** (عقود) — the permanent "Incorporation Contract" (عقد التأسيس, `CREATING`),
  "Amendment Contracts" (عقود تعديل, `UPDATING`) generated with AI, and other types (`OTHER`).
- **Tasks** (مهام) — manager→employee task management with subtasks, multi-employee tasks,
  FREE-task claiming, and a manager **review lifecycle** for amendment tasks
  (`/review/:taskId`).
- **Employees / org structure** — users, roles, branches (فروع), departments (أقسام),
  employee assignments, attendance with geolocation, employee guides, activity logs.

## Business problem it solves

Digitizing the office's paper workflow: scan an incorporation contract (OCR), store its
structured articles, let employees draft **AI-assisted amendments** to specific articles,
route those amendments through **manager review** (accept/return), and track the office's
daily work via tasks and attendance.

## Main users / roles

Roles are stored in the `roles` table (names lower-cased in code checks) and mapped to four
canonical roles in `Backend/.../enums/SystemRole.java` and `Frontend/src/utils/roles.js`:

| Canonical role | DB role name(s) seen in code | Meaning |
|---|---|---|
| `OWNER` | `owner` | Full access, cross-branch |
| `BRANCH_MANAGER` | `headBranch` (legacy alias `manager` in some UI lists) | Own branch |
| `DEPARTMENT_MANAGER` | `headDepartment` | Managed departments (`department_manager_departments`) |
| `EMPLOYEE` | `employee` | Own work only |

## High-level architecture

```
Browser (React 19 SPA, Vite, RTL Arabic)
   │  axios (Bearer JWT from localStorage)
   ▼
Spring Boot 4 REST API (port 8080, /api/**)
   │                      │
   │                      └──► External OCR microservice (ocr.api.url, Ngrok tunnel,
   │                           PDFBox page rendering → /predict pairs)
   ▼
JPA / Hibernate 7 ──► PostgreSQL (Neon cloud, ddl-auto=none, manual migrations)
   │
   └──► Filesystem store ../FileSystem (contract PDFs + ocrData.json per company)

Separately (frontend-only AI):
Browser ──► Ollama local server (/api/generate, /api/embeddings)
            models: qwen-local (generation), qwen3-embedding:0.6b (embeddings)
```

**Key architectural fact:** the LLM (Ollama) is called **directly from the browser**
(`Frontend/src/api/ollamaClient.js`). The backend never calls an LLM; the backend only
**renders and stores** the amendment PDF from the payload the frontend sends
(`POST /api/contracts/amendments/generate`, `POST /api/pdf/generate`).

## Technology summary

- **Frontend:** React 19, Vite 7, react-router-dom 7, Tailwind 3 (CSS-variable theme), axios,
  lucide-react icons, react-pdf 10 (present but its main viewer is unfinished), html2pdf.js,
  react-markdown, i18next (mounted but effectively unused).
- **Backend:** Java (pom targets 21; runtime observed on Java 25/26), Spring Boot **4.0.2**,
  Spring Data JPA / Hibernate 7, PostgreSQL driver, JJWT 0.12.6, Thymeleaf + flexmark +
  OpenHTMLtoPDF + PDFBox (PDF), Spring Mail, WebFlux (used by OcrService WebClient), devtools.
- **Database:** PostgreSQL 17 (Neon).
- **AI:** Ollama (local, from frontend); external OCR HTTP service; Mistral OCR scripts in `AI/`.
- **Build:** Maven wrapper (`mvnw`), Vite, Dockerfiles + docker-compose.

---

# 2. Repository Structure

```
accounting-office/
├── AI/                              # Standalone Python OCR experiments (NOT part of the running app)
│   ├── ocr2.py                      # Mistral OCR → contract_structured.json; splits articles by "مادة N"
│   ├── ocr_test.py                  # Smaller Mistral OCR test script
│   ├── score.py                     # ⚠ actually an HTML file mis-named .py (see Known Issues)
│   ├── article_templates/templates_approved.json  # clustered article templates w/ similarity stats
│   ├── TEST3.pdf / test.pdf / test2.pdf / *.json  # sample data
├── Backend/
│   ├── Dockerfile                   # multi-stage temurin 25, port 8080
│   ├── FileSystem/                  # runtime document store (see §19); fakeData/ referenced but absent
│   ├── pom.xml                      # Spring Boot 4.0.2, Java 21, jjwt, thymeleaf, openhtmltopdf, pdfbox, flexmark, webflux, mail
│   └── src/
│       ├── main/java/com/accounting/backend/
│       │   ├── BackendApplication.java
│       │   ├── config/              # DatabaseInitializer (manual migration runner), JacksonConfig
│       │   ├── controller/          # LedgerController (note: singular package)
│       │   ├── controllers/         # all REST controllers (Auth, User, Company, Branch, Department,
│       │   │                        #   EmployeeAssignment, DepartmentManager, Task, Contract,
│       │   │                        #   ContractApproval, TaskApproval, Comment, Notification,
│       │   │                        #   ActivityLog, Attendance, Guide, Reporting, Permission,
│       │   │                        #   PermissionRole, Role, UserRole, Files, Ocr, Pdf)
│       │   ├── dto/  dtos/          # two DTO packages (legacy split; both used)
│       │   ├── entities/ (entity/)  # JPA entities; Ledger.java lives in entity/ and is NOT an entity
│       │   ├── enums/               # TaskStatus, SubTaskStatus, ContractType/Status, UserStatus, ...
│       │   ├── repositories/        # Spring Data JPA interfaces
│       │   ├── security/            # JwtService
│       │   └── services/            # TaskService, TaskReviewService, AuthorizationService, AuthService,
│       │                            #   TokenCacheService, PdfService, FileService, OcrService,
│       │                            #   AssemblyService, ContracteService, NotificationService, ...
│       └── main/resources/
│           ├── application.properties
│           ├── db/migrate-subtasks.sql          # configured but NOT executed (sql.init.mode=never)
│           ├── db/migration/V1..V3__*.sql       # executed by DatabaseInitializer (hardcoded list)
│           ├── fonts/NotoNaskhArabic-*.ttf      # Arabic font for PDF rendering
│           └── templates/pdf-template.html      # Thymeleaf amendment-PDF template
│   └── src/test/java/com/accounting/backend/    # BackendApplicationTests, Phase1/Phase2AuthorizationTest,
│                                                #   TaskFlowRegressionTest (all hit the live DB)
├── Frontend/
│   ├── Dockerfile                   # node:20 build → `serve -s dist -l 3000`
│   ├── .env                         # VITE_API_URL, VITE_OLLAMA_URL (committed to git)
│   ├── package.json                 # scripts: dev / build / lint / preview
│   └── src/
│       ├── main.jsx, App.jsx        # provider order: I18next > Theme > Language > Router > Sidebar > App
│       ├── api/                     # axios modules — one per backend domain (+ ollamaClient.js)
│       ├── components/              # ProtectedRoute + several DEAD components (see §31)
│       ├── context/                 # ThemeContext, LanguageContext, SidebarContext
│       ├── features/
│       │   ├── login/               # LoginPage
│       │   ├── dashboard/           # DashboardPage (client-side aggregation of 7 endpoints)
│       │   ├── tasks/               # EmployeeTasksPage, AssignedTasksDashboard, TaskDetailsModel,
│       │   │                        #   ReviewTaskPage, SubtaskFormModal, DeleteConfirmModal
│       │   ├── companies/           # OLD companies module (OCR browser + AI amendment page v1)
│       │   ├── companies2/          # NEW companies module (contract workflows, FinalContractReview)
│       │   ├── companiesManagment/  # ⚠ orphaned earlier draft, broken imports
│       │   ├── employees/  departments/  branches/  attendance/  activityLogs/
│       │   ├── documents/  guides/  ledger/       # ledger is orphaned
│       ├── shared/                  # layout (MainLayout/Sidebar/TopBar), components (HrShared...),
│       │                            #   hooks, data (mostly dead mock data)
│       ├── utils/                   # roles.js, apiError.js, dateFormat.js, dashboardFormat.js
│       └── i18n/ locales/           # mounted but no t() calls anywhere
├── docker                           # ⚠ an empty 0-byte FILE (not a directory)
├── docker-compose.yml               # backend (8080) + frontend (3000) against the same Neon DB
├── docs/dashboard-summary-endpoint.md  # PROPOSAL for GET /api/dashboard/summary (not implemented)
└── README.md
```

---

# 3. Technology Stack

| Layer | Technology | Version | Purpose | Where Used |
|---|---|---|---|---|
| Backend language | Java | target 21 (pom.xml); observed runtime Java 25/26 | application code | `Backend/` |
| Framework | Spring Boot | 4.0.2 | REST API, DI, scheduling of concerns | `Backend/pom.xml` |
| Web | spring-boot-starter-webmvc | (Boot-managed) | MVC/REST controllers | all controllers |
| Validation | spring-boot-starter-validation | (Boot-managed) | declared; **no bean-validation annotations found on DTOs** — validation is manual | controllers/services |
| Persistence | Spring Data JPA + Hibernate | 7.x (Boot 4) | ORM, JPQL, pessimistic locks | entities, repositories |
| DB | PostgreSQL (Neon cloud) | server 17.x | persistence | `application.properties` |
| Security | JJWT (io.jsonwebtoken) | 0.12.6 | HS256 JWT issue/parse | `security/JwtService.java` |
| Password hashing | Spring Security Crypto `BCryptPasswordEncoder` | (single jar, no full Spring Security filter chain) | user passwords | `AuthService`, `UserController` |
| Mail | spring-boot-starter-mail | (Boot-managed) | temp-password emails (Gmail SMTP) | `EmailService` |
| Reactive client | spring-boot-starter-webflux | (Boot-managed) | `WebClient` for OCR calls | `OcrService` |
| PDF parsing | Apache PDFBox | (Boot-managed) | render PDF pages to images for OCR | `OcrService` |
| PDF generation | OpenHTMLtoPDF (core/pdfbox/rtl) + flexmark (markdown tables) + Thymeleaf | (Boot-managed) | server-side amendment PDF | `PdfService`, `templates/pdf-template.html` |
| Migrations | Manual SQL runner (NOT Flyway) | — | V1–V3 executed at boot | `config/DatabaseInitializer.java` |
| Frontend | React | 19.2.0 | SPA | `Frontend/src` |
| Build tool | Vite | 7.3.1 | dev server + build | `vite.config.js` |
| Routing | react-router-dom | 7.14.0 | SPA routes | `App.jsx` |
| Styling | Tailwind CSS | 3.4.19 (`darkMode:"class"`) + `@tailwindcss/postcss` 4.2.2 in deps | theme via CSS vars | `tailwind.config.js`, `index.css` |
| HTTP client | axios | 1.15.2 | API calls w/ interceptors | `api/client.js` |
| Icons | lucide-react | 1.8.0 | all icons | everywhere |
| PDF render (FE) | react-pdf | 10.4.1 | present; PdfPage viewer is commented out | `features/companies/components/PdfPage.jsx` |
| PDF download (FE) | html2pdf.js | 0.14.0 | client-side contract PDF export | `FinalContractReview` |
| Markdown (FE) | react-markdown + remark-gfm | 10.1.0 / 4.0.1 | contract text rendering | `FinalContractReview`, `PdfViewer` |
| AI | Ollama REST | external server | generation + embeddings, **called from the browser** | `api/ollamaClient.js` |
| i18n | i18next + react-i18next + detector | 26 / 17 / 8 | mounted; **no `t()` calls** | `i18n/config.js` |
| Speech | Web Speech API | browser | mic dictation | `shared/hooks/useSpeechRecognition.js`, `MicButton` |
| OCR (experiments) | Python + Mistral OCR | — | standalone scripts, not wired into the app | `AI/` |
| Containers | Docker, docker-compose | — | backend 8080 / frontend 3000 | `*/Dockerfile`, `docker-compose.yml` |
| Frontend tests | — | — | **none exist** | — |
| Backend tests | JUnit 5 + `@SpringBootTest` | Boot-managed | service-level integration tests vs live DB | `Backend/src/test` |

Not present: Flyway/Liquibase, Spring Security filter chain, Redis/message queues, GraphQL, testcontainers, CSS-in-JS, Redux/Zustand (state is React local state + localStorage).

---

# 4. Application Architecture

## Frontend architecture

- Single SPA. `main.jsx` mounts providers in this order:
  `I18nextProvider → ThemeProvider → LanguageProvider → BrowserRouter → SidebarProvider → App`.
- `App.jsx` declares **all routes statically** (no nested routing system, no lazy imports).
- Feature folders under `src/features/<domain>/{pages,components,services,hooks}`; several
  barrels (`index.js`) exist but many are decorative or broken (§31).
- **State management:** React local state + `localStorage`. There is **no global store**.
  Two localStorage keys drive the whole session:
  - `authToken` — raw JWT string.
  - `user` — JSON of the user's **profile object** (stored by LoginPage from
    `GET /users/{id}/profile`), containing `id, fullName, email, roleName, canonicalRole,
    status, branchId, departmentId, managedDepartmentIds, ...`.
- **API layer:** one module per domain in `src/api/`, all sharing the axios instance in
  `api/client.js` (base URL `VITE_API_URL` or `http://localhost:8080/api`; request interceptor
  adds `Authorization: Bearer <authToken>`; response interceptor on 401 clears both keys and
  redirects to `/`).
- **Styling:** RTL by default (`dir="rtl"` on html and on page containers), theme colors as CSS
  variables consumed through Tailwind custom colors (`appSurface`, `appBorder`, `brand`, ...),
  shared classes like `rounded-2xl border border-appBorder bg-appSurface shadow-panel`.

## Backend architecture

Classic layered Spring MVC, **no Spring Security filter chain** — auth is enforced manually
inside controllers/services:

```
@RestController (controllers/)
   → manual JWT extraction (JwtService.extractUserId) and/or
     AuthorizationService.requireAuthenticatedUser(authHeader)  [JWT + TokenCacheService]
   → role checks via AuthorizationService (SystemRole) or TaskService.assertManager
   → @Service (services/)
   → JpaRepository (repositories/)
   → PostgreSQL
```

Cross-cutting services:
- `AuthorizationService` — role resolution, branch/dept resolution via `EmployeeAssignment`,
  user/company/task scope checks, `validateTaskAssignment`.
- `ActivityLogService.logAction(...)` — `REQUIRES_NEW` audit insert; never breaks main flow.
- `NotificationService.createNotification(userId, title, message, type, referenceId)`.
- `TokenCacheService` — in-memory `ConcurrentHashMap<userId, token>`; **one active token per
  user** (new login invalidates old; restart invalidates all).

## Database architecture

- Remote Neon PostgreSQL; `ddl-auto=none` — schema is **never** auto-generated.
- Schema changes are SQL files under `src/main/resources/db/migration/` executed by
  `DatabaseInitializer` (a `CommandLineRunner` with a **hardcoded script list**; scripts are
  idempotent `IF NOT EXISTS` style). **A new migration file must be registered there manually.**
- `spring.sql.init.mode=never`, so `db/migrate-subtasks.sql` is configured but NOT executed by Spring.
- NoFlyway/Liquibase. Tests run against the **same live database** (no test DB, no testcontainers).

## AI integration (the real one)

```
Browser (CreateUpdatingContractPage / CreateAmendmentAi feature)
   │  POST {VITE_OLLAMA_URL}/generate        {model:"qwen-local", prompt, stream}
   │  POST {VITE_OLLAMA_URL}/embeddings      {model:"qwen3-embedding:0.6b", prompt}
   ▼
Ollama (local server) ──► modified article text / embedding vector
   │  (cosine similarity computed IN THE BROWSER, threshold 0.5)
   ▼
Frontend assembles PdfRequest payload
   │  POST /api/pdf/generate            → PDF bytes (download/preview)
   │  POST /api/contracts/amendments/generate → server renders PDF, saves file,
   │                                           persists Contract(UPDATING, PENDING_APPROVAL, task_id)
   ▼
PostgreSQL + ../FileSystem/{companyId} - {name}/EditingContracts/*.pdf
```

OCR (company onboarding) is a **separate backend-only** flow:
`OcrService` (WebClient) → external OCR service (`ocr.api.url`, Ngrok to a Lightning AI box),
posting overlapping PDF page pairs to `/predict`; `AssemblyService` merges chunks into a
`ContractDocument` (articles list).

## File / PDF architecture

- Everything lives under `../FileSystem` **relative to the backend working directory**
  (`FileService.rootDirectory`). Per-company layout:
  `{companyId} - {companyName}/CreationContract|EditingContracts|OtherTypesContracts/`.
  Establishment companies also store `CreationContract/ocrData.json` + `creatingContract.pdf`
  (these exact filenames are hardcoded in the frontend, see §20).
- PDF retrieval: `GET /api/files/file?path=...` (auth required, traversal guard) → frontend
  wraps in a Blob → `<iframe>` (the working viewer pattern) or react-pdf (broken, §31).
- Server PDF generation: `PdfService.generateAmendmentPdf(...)` — Thymeleaf `pdf-template`
  + flexmark markdown + OpenHTMLtoPDF with ICU bidi + Noto Naskh Arabic font.

---

# 5. Configuration and Environment

## Backend — `Backend/src/main/resources/application.properties`

| Property | Value / note |
|---|---|
| `server.port` | 8080 |
| `server.error.include-message` | always |
| `spring.datasource.url` | `jdbc:postgresql://ep-orange-bonus-an80r1b5-pooler...neon.tech/neondb?sslmode=require&stringtype=unspecified` (Neon cloud) |
| `spring.datasource.username` | `neondb_owner` |
| `spring.datasource.password` | **committed in the file** — must be masked; treat as sensitive |
| `spring.jpa.hibernate.ddl-auto` | **none** |
| `spring.sql.init.mode` | **never** (so `schema-locations` is never run) |
| `spring.sql.init.schema-locations` | `classpath:db/migrate-subtasks.sql` (dead config) |
| `spring.jpa.properties.hibernate.dialect` | PostgreSQLDialect (Hibernate warns it's unnecessary) |
| `spring.jpa.open-in-view` | false |
| `spring.servlet.multipart.max-file-size` / `max-request-size` | declared **twice**; effective value **20MB** (last wins) |
| HikariCP | pool 10, minIdle 2, timeouts 30s/10min/30min, leak detection 60s |
| `spring.devtools.restart.enabled` | false (devtools on classpath but restart disabled) |
| `jwt.secret` | committed placeholder-style key — masked here |
| `jwt.expiration-ms` | 86400000 (24h) |
| `spring.mail.*` | smtp.gmail.com:587, real Gmail account + app password committed (masked here) |
| `ocr.api.url` | `https://bash-upgrade-eggshell.ngrok-free.dev` — Ngrok tunnel to the OCR service; **must be updated whenever the OCR box restarts** (per code comment) |

**No environment-variable indirection exists** — values are hardcoded in the properties file
(and duplicated in `docker-compose.yml`). There is no `application-docker.properties`; the
compose file sets `SPRING_PROFILES_ACTIVE=docker` but that profile has no properties file
(Boot falls back to defaults).

## Frontend — `Frontend/.env` (committed to git)

| Variable | Consumed by | Purpose |
|---|---|---|
| `VITE_API_URL` | `api/client.js` | backend base URL (default `http://localhost:8080/api`) |
| `VITE_OLLAMA_URL` | `api/ollamaClient.js` | Ollama base (default `http://localhost:11434/api`) |

⚠ `docker-compose.yml` sets `VITE_API_BASE_URL` for the frontend container — the code reads
`VITE_API_URL`, so in Docker the fallback URL applies (see Known Issues).

## CORS

Every controller uses `@CrossOrigin(origins = "*")` — all origins allowed.

## OCR / AI services

- OCR: external HTTP service, contract = `POST {ocr.api.url}/predict` (multipart image1,
  image2, file_id, page_start), `GET /health`. 300s timeout per call. See `OcrService`.
- AI: Ollama must be running locally with models `qwen-local` and `qwen3-embedding:0.6b`.

---

# 6. Database / Persistence Model

All entities live in `Backend/src/main/java/com/accounting/backend/entities/`
(exception: `entity/Ledger.java`, which is **not** a JPA entity).

## User — `users`

| Field | Column | Type | Required | Notes |
|---|---|---|---|---|
| id | id | Long IDENTITY | ✔ | |
| fullName | full_name | String | ✔ | |
| email | email | String | ✔ unique | lookups use `findByEmailIgnoreCase` |
| phone | phone | String | – | |
| nationalId | national_id | String | – | unique, nullable |
| password (field `passwordHash`) | password | String | ✔ | BCrypt hash; `@JsonIgnore` on getter |
| status | status | `UserStatus` (PG enum) | ✔ | default `ACTIVE`; values ACTIVE, SUSPENDED, RESIGNED, PENDING_VERIFICATION |
| hireDate | hire_date | LocalDate | – | |
| createdAt / updatedAt / deletedAt | | LocalDateTime | ✔/✔/– | soft delete column exists; deletes via API are HARD |

Inverse (LAZY, mappedBy, no cascade): `employeeAssignments`, `userRoles`, `assignedTasks` (Task.assignedTo), `contractsCreated` (Contract.createdBy).

## Role — `roles`: `id`, `name` (unique), `level` (Integer, default 0).
## UserRole — `user_roles`: `@EmbeddedId UserRoleId{userId, roleId}`; `@ManyToOne` User/Role via `@MapsId`.
## Permission — `permissions`: `id`, `code` (unique), `description`. Wired to roles via
## PermissionRole — `permission_roles` (`PermissionRoleId{roleId, permissionId}`). **The permission tables are not consulted by any runtime authorization logic** (roles are string-checked); they are scaffolding.

## Branch — `branches`: `id`, `name` (NOT NULL), `address`, `phone`. No JPA relationships declared.

## Department — `departments`: `id`, `name` (NOT NULL), `branch_id` → Branch (**nullable=false**).

## EmployeeAssignment — `employee_assignments`
`id`; `user_id` → User (NOT NULL); `branch_id` → Branch (NOT NULL); `dept_id` → Department (NOT NULL); `is_primary` (Boolean, default false); `start_date` (NOT NULL); `end_date` (nullable).
This is the **only** source of a user's branch/department (`AuthorizationService.getUserBranchId/getUserDepartmentId` pick primary first, else first row).

## DepartmentManagerDepartment — `department_manager_departments`
`@EmbeddedId {managerId→users, departmentId→departments}`; created by V1 migration; grants a
DEPARTMENT_MANAGER multiple departments.

## Company — `companies`
`id`; `name` (NOT NULL); `company_type` (NOT NULL, plain String — the `CompanyType` enum exists but is unused here); `commercial_reg_no` (unique, nullable); `tax_id` (unique, nullable); `status` (`CompanyStatus` STRING, default ACTIVE; ACTIVE/CLOSED); `created_at`/`updated_at` (NOT NULL); `deleted_at` (**soft delete, honored by queries**).
EAGER `@ManyToOne` `branch_id`, `department_id` (nullable). `contracts` is `@Transient` — populated manually by `CompanyController` via `contractRepository`.

## Contract — `contracts`
| Field | Column | Type | Required | Notes |
|---|---|---|---|---|
| id | id | Long IDENTITY | ✔ | |
| type | type | `ContractType` | ✔ | CREATING (عقد تأسيس), UPDATING (عقد تعديل), OTHER |
| company | company_id | `@ManyToOne` Company | ✔ | |
| createdBy | created_by | `@ManyToOne` User | ✔ | |
| filePath | file_path | String | – | path relative to `../FileSystem` |
| status | status | `ContractStatus` | ✔ | DRAFT, **PENDING_APPROVAL**, APPROVED, REJECTED |
| createdAt / updatedAt / deletedAt | | LocalDateTime | ✔/✔/– | |
| ocrData | ocr_data | TEXT | – | JSON payload (OCR result or amendment `PdfRequest`) |
| task | task_id | `@ManyToOne` Task | – | **added by V3 migration**; links an amendment to its review task; FK `ON DELETE SET NULL` |

## Task — `tasks`
`id`; `title` (NOT NULL); `description`; `assigned_to` → User (nullable — null enables FREE);
`created_by` → User (NOT NULL); `status` (`TaskStatus` STRING varchar(50), default PENDING);
`due_date`; `department_id` → Department (nullable); `company_id` → Company (EAGER, nullable);
`created_at` (NOT NULL); `deleted_at`; `version` (`@Version`, BIGINT, from migrate-subtasks.sql).
`@OneToMany comments` and `subTasks`: LAZY, **cascade ALL + orphanRemoval**.

## SubTask — `sub_tasks`
`id`; `title` (NOT NULL); `description`; `assigned_to` → User (nullable → FREE subtask);
`due_date`; `status` (`SubTaskStatus` varchar(50), NOT NULL, default PENDING); `task_id` → Task
(NOT NULL, `@JsonIgnore`); `created_at` (`@PrePersist`); `deleted_at`. DB also has a `version`
column (migration) — not mapped in the entity.

## TaskComment — `task_comments`: `task_id` (NOT NULL), `comment_by` → User (NOT NULL), `message` TEXT (NOT NULL), timestamps, `deleted_at` (column exists but DELETE is hard).

## TaskApproval / ContractApproval — `task_approvals` / `contract_approvals`
`task_id`/`contract_id` (NOT NULL), `approved_by` → User (NOT NULL), `status` (`ApprovalStatus` STRING default PENDING), `comment`, `approved_at`. **Generic CRUD only; the runtime approve flow does not use them** (task acceptance is `TaskStatus.ACCEPTED`; amendment approval is `ContractStatus.APPROVED`).

## Attendance — `attendances`
Unique constraint `uk_attendances_user_work_date (user_id, work_date)`. `user_id` (NOT NULL), `work_date` (NOT NULL), start/end time + lat/lng/accuracy (Doubles), `worked_minutes`, `status` (`AttendanceStatus` PG enum: WORKING/COMPLETED), timestamps.

## ActivityLog — `activity_logs`
`user_id` (Long, **no FK**), `company_id` (Long nullable), `entity_type` (`EntityType` STRING NOT NULL), `entity_id`, `action` (`ActionType` STRING NOT NULL), `summary` TEXT, `metadata` TEXT (JSON string), `created_at` (NOT NULL, updatable=false). `userName` is `@Transient` (display only).

## Guide / GuideStep — `guides` / `guide_steps`
Guide: `title` (NOT NULL), `category` (NOT NULL), `description`, `icon`, `color`, `status` (plain String, default `"draft"`; visibility filter is `"published"`), `created_by`/`updated_by` (NOT NULL), timestamps; `steps` `@OneToMany` cascade ALL + orphanRemoval, `@OrderBy("stepOrder ASC")`.
GuideStep: `guide_id` (NOT NULL), `step_order` (NOT NULL), `title` (NOT NULL), `description` (NOT NULL), `note`, `entity_name`, `company_id` (reserved).

## Reporting — `reporting`: `employee_id` → User (NOT NULL), `manager_id` → User (NOT NULL), `start_date` (NOT NULL), `end_date`.

## Non-JPA models
- `entities/ContractDocument.java` — **POJO** for OCR/assembly payloads: snake_case getters
  (`company_name`, `company_address`, `company_type`, `company_capital`,
  `commercial_register_number`, `approval_date`, `real_estate_registry_minutes_number`,
  `company_duration`, `company_activity`), `law_reference {law_number, law_year}`,
  `articles: List<Article{id, value}>`.
- `entity/Ledger.java` — **POJO**; `LedgerController` returns a hardcoded in-memory list.

## ER-style overview

```
roles ──< user_roles >── users ──< employee_assignments >── branches
                                   └────────> departments <──┘
permission_roles >── permissions        departments ──< department_manager_departments >── users
users 1──* tasks *──1 departments, companies          tasks 1──* sub_tasks *──1 users
tasks 1──* task_comments *──1 users                   tasks 1──* task_approvals
companies 1──* contracts *──1 users(createdBy)        contracts 1──* contract_approvals
contracts *──1 tasks (task_id, V3, ON DELETE SET NULL)
users 1──* attendances (unique per work_date)         users 1──* activity_logs (no FK)
users 1──* employee_assignments (branch+department)   guides 1──* guide_steps
```

---

# 7. DTOs and API Data Contracts

Two packages: `dto/` (tasks domain + misc) and `dtos/` (auth/users). No bean validation —
validation is manual code in services/controllers.

| DTO | Package | Fields | Used by |
|---|---|---|---|
| `TaskRequest` | dto | title, description, branchId, departmentId, assignedToId, createdById, companyId, status (`TaskStatus`), dueDate, subtasks: `List<SubTaskRequest>` | `TaskController` POST/PUT `/tasks` |
| `SubTaskRequest` | dto | id (for updates), title, description, dueDate, assignedToId | task create/update, `/tasks/{id}/subtasks` |
| `TaskResponse` | dto | id, title, description, assignedToId/Name, createdById/Name, branchId/Name, departmentId/Name, dueDate, createdAt, comments: `List<CommentResponse>`, status, subtasks: `List<SubTaskResponse>`, workingEmployees: `List<TaskWorkerResponse>`, **free: boolean** | every task endpoint. Built by `TaskResponse.mapToResponse(Task)`; also carries static helpers `liveSubTasks`, `isFree`, `workingEmployees` used by services |
| `SubTaskResponse` | dto | id, title, description, dueDate, assignedToId/Name, status, createdAt (from entity) | inside TaskResponse |
| `TaskWorkerResponse` | dto | id, fullName | inside TaskResponse |
| `CommentRequest` / `CommentResponse` | dto | {taskId, createdById, message} / {id, message, createdByName, createdAt} | `CommentController` |
| `AttendanceResponse` | dto | id, userId, employeeName, workDate, start/end time+lat+lon+acc, workedMinutes, status | `AttendanceController` |
| `PartnerDto` | dto | title, name, role | `PdfController.PdfRequest.partners` |
| `LoginRequest` | dtos | email, password | `POST /auth/login` |
| `RegisterRequest` | dtos | fullName, email, password, phone, nationalId | `POST /auth/register` |
| `ChangePasswordRequest` | dtos | email, currentPassword, newPassword | `POST /auth/change-password` |
| `AuthResponse` | dtos | success, message, user: `UserDto`, token | all auth endpoints |
| `UserDto` | dtos | id, fullName, email, phone, nationalId, status, hireDate, roleName, canonicalRole, branchId, branchName, departmentId, departmentName, managedDepartmentIds | auth responses |
| `EmployeeCreationRequest` | dtos | fullName, email, phone, nationalId, password (unused — temp pwd generated), status, hireDate, departmentId, branchId, roleId | `POST/PUT /users` |
| `CreateCompanyRequest` | dtos | company fields for `POST /api/companies/with-contract` | `CompanyController` |
| `GuideRequest` / `GuideResponse` / `GuideStepRequest` | dtos | guide CRUD payloads | `GuideController` |
| `NotificationResponce` (sic) | dtos | id, title, message, read, type, referenceId, createdAt | `NotificationController` |
| `UserDto` fields as stored in frontend `localStorage.user` | — | id, fullName, roleName, canonicalRole, branchId, departmentId, managedDepartmentIds, ... | **the SPA's session object** |

**Contract payloads (JSON over the wire):**

- Amendment generation request — `POST /api/contracts/amendments/generate`:
```json
{
  "companyId": 5,
  "taskId": 12,                 // optional; links the amendment to its review task
  "fileName": "عقد تعديل المادة 2.pdf",
  "pdf": {                       // PdfController.PdfRequest
    "contractTitle": "...", "companyName": "...", "companyLegalLine": "...",
    "introText": "...", "companyCapital": "...", "contractDate": "2026-09-08",
    "partners": [{ "title": "...", "name": "...", "role": "..." }],
    "sections": [{
      "id": "0", "selectedArticleId": "1", "selectedArticleTitle": "المادة 2",
      "beforeText": "...", "afterText": "...", "modelOutput": "...",
      "amendmentTitle": "...", "embeddingScore": 0.87
    }]
  }
}
```
Response: the saved `Contract` entity (`status: PENDING_APPROVAL`).

- `Contract.ocrData` for UPDATING contracts is the serialized `PdfRequest` above; for CREATING
  contracts it is the OCR `ContractDocument`-shaped JSON (`company_name`, ..., `articles:[{id, value}]`).

**Transformation notes**
- `TaskResponse.mapToResponse` derives `free` (parent unassigned AND no live assigned non-DONE
  subtask), `workingEmployees` (parent + subtask assignees with non-DONE subtasks), and branch
  names via `task.department.branch`.
- User JSON (`buildUserMap` in `UserController`) adds `departmentId/branchId/departmentName/
  branchName/roleId/roleName/canonicalRole/managedDepartmentIds` computed from assignments/roles.
- Dates: because `config/JacksonConfig` replaces Boot's ObjectMapper with a plain
  `new ObjectMapper()`, `LocalDateTime`/`LocalDate` serialize as **numeric arrays**
  (e.g. `[2026,9,8,2,0,0]`). The frontend has compatibility helpers
  (`utils/dashboardFormat.js dateValueToMs`).

---

# 8. Backend API Documentation

Base: `http://localhost:8080/api`. Auth legend:
**REQ** = `AuthorizationService.requireAuthenticatedUser` (JWT + in-memory token cache + user
lookup); **JWT** = only `JwtService.extractUserId`/parse (no cache check); **NONE** = no auth.

## 8.1 Authentication — `AuthController` (`/api/auth`)

| Method & Path | Auth | Body | Response | Errors | Used by |
|---|---|---|---|---|---|
| POST `/auth/register` | NONE | `RegisterRequest` | `AuthResponse` (ACTIVE user + employee role + JWT) | 400 duplicate/invalid | `api/auth.js register` (note: it actually POSTs `/users` — see §23) |
| POST `/auth/login` | NONE | `LoginRequest` | `AuthResponse` + JWT; token cached | 401 invalid; inactive (SUSPENDED/RESIGNED) message | `LoginPage` via `login()` |
| GET `/auth/me` | JWT | – | `AuthResponse` w/ `UserDto` | 401 | `getCurrentUser()` |
| POST `/auth/logout` | NONE (token optional) | – | success message; invalidates cached token | – | `logout()` |
| GET `/auth/verify` | JWT | – | `{success:true,...}` | 401 | `ProtectedRoute` on every guarded navigation |
| POST `/auth/change-password` | NONE (email+current password) | `ChangePasswordRequest` | 200; PENDING_VERIFICATION → ACTIVE | 400 wrong/short | activation flow for temp passwords |

Login flow detail (`AuthService`): bcrypt verify; SUSPENDED/RESIGNED rejected; PENDING_VERIFICATION
**can** log in (told to change temp password); JWT = HS256, subject=email, claim `userId`,
24h; token stored in `TokenCacheService` (single-session). `enrichUserDto` adds role +
branch/dept + managed departments.

## 8.2 Users — `UserController` (`/api/users`)

| Method & Path | Auth | Notes |
|---|---|---|
| GET `/users?branchId=&departmentId=` | REQ + role scoping | OWNER all; BRANCH_MANAGER own branch (minus owners); DEPT_MANAGER self + managed depts (minus owners); EMPLOYEE self only. Filters applied after scoping. Response: `List<Map>` (see `buildUserMap`) |
| GET `/users/{id}` | REQ + `canViewUser` | 403 Arabic error, 404 |
| GET `/users/{id}/profile` | REQ + `canViewUser` | `EmployeeProfileService.getProfile` — base info + tasks (`findVisibleToAssignee`) + assignedByTasks + contracts |
| POST `/users` | REQ + role rules | creates user w/ random 8-digit temp password (bcrypt), status `PENDING_VERIFICATION`, primary `EmployeeAssignment`, `UserRole`; emails temp password (`EmailService`); 409 on duplicate email/nationalId/phone |
| PUT `/users/me` | REQ | self update (fullName, phone) |
| PUT `/users/{id}` | REQ (+ `canManageUser` for others) | full update incl. status/assignment/role (via `canChangeUserRole`); returns change log list |
| DELETE `/users/{id}` | REQ + `canManageUser` | hard delete (assignments + user_roles + user) |

## 8.3 Companies — `CompanyController` (`/api/companies`)

| Method & Path | Auth | Notes |
|---|---|---|
| GET `/companies` | REQ + role scoping | returns `Company` list with `contracts` (transient) populated |
| GET `/companies/{id}` | REQ + `canViewCompany` | soft-deleted → 404 |
| POST `/companies` | REQ + `canCreateCompany` + branch/dept consistency | raw `Company` JSON; `branch.id` + `department.id` required |
| PUT `/companies/{id}` | REQ + `canManageCompany` | branch immutable; dept changes validated |
| DELETE `/companies/{id}` | REQ + `canManageCompany` | **soft delete** (deletedAt) |
| POST `/companies/with-contract` | REQ + `canCreateCompany` | multipart: `company` JSON + `pdf` + `ocrJson`; creates FS folders, saves `CreationContract/original pdf` + `ocrData.json`, creates `Contract(CREATING, APPROVED)` |

## 8.4 Branches / Departments / Assignments / Department managers

| Method & Path | Auth | Notes |
|---|---|---|
| GET `/branches` | weak (unauth returns ALL) | authenticated: role-scoped |
| GET `/branches/{id}` | **NONE** | |
| POST/PUT/DELETE `/branches[...]` | REQ + `isOwner` | hard delete |
| GET `/departments?branchId=` | weak (unauth returns list) | authenticated: role-scoped |
| GET `/departments/{id}` | **NONE** | |
| POST/PUT/DELETE `/departments[...]` | REQ + OWNER or BRANCH_MANAGER (own-branch rules) | |
| GET/POST/PUT/DELETE `/employee-assignments[...]` | REQ (+ role scope; EMPLOYEE 403 on writes) | |
| GET `/department-managers/{managerId}/departments` | REQ + `canViewUser` | |
| POST/DELETE `/department-managers/{managerId}/departments/{departmentId}` | REQ + OWNER or BRANCH_MANAGER | manages `department_manager_departments` |

## 8.5 Tasks — `TaskController` (`/api/tasks`) — the core domain

| Method & Path | Auth | Purpose / Rules |
|---|---|---|
| GET `/tasks` | JWT (caller extracted) | **Scoping:** managers (owner/manager/headbranch/headdepartment) → all; employees → `findVisibleToAssignee` (own work + FREE in scope). Frontend `EmployeeTasksPage` uses this. |
| GET `/tasks/{id}` (also legacy `/tasks/tasks/{id}`) | NONE | single task (no explicit check — see §25) |
| POST `/tasks` | JWT + `assertManager` | create; `validateTaskAssignment` for parent + every subtask (branch/dept/role); notifications to assignees |
| PUT `/tasks/{id}` | JWT | dual-mode: employee → only status changes on own task; manager/creator → full edit (creator-only via `canEditTask`), reassignment cascade, subtask sync, status transitions. **Accept = PUT with `{"status":"ACCEPTED"}`** |
| DELETE `/tasks/{id}` | JWT + `assertManager` | deletes TaskApprovals + task (hard) |
| POST `/tasks/{id}/subtasks` | JWT + `assertManager` | add subtask; **validates assignee within task's branch+department** |
| PUT `/tasks/{id}/subtasks/{subTaskId}` | JWT + `assertManager` | update; status reset to PENDING on content/assignee change |
| DELETE `/tasks/{id}/subtasks/{subTaskId}` | JWT + `assertManager` | |
| POST `/tasks/{id}/subtasks/{subTaskId}/start` | JWT | assignee only; PENDING → IN_PROGRESS |
| POST `/tasks/{id}/subtasks/{subTaskId}/complete` | JWT | assignee only; IN_PROGRESS → DONE; parent → DONE when all done (creator notified) |
| POST `/tasks/{id}/claim` | JWT | claim FREE task (lock via `findByIdForUpdate`); **branch+dept scope enforced** |
| POST `/tasks/{id}/subtasks/{subTaskId}/claim` | JWT | claim FREE subtask (same scope rules) |
| POST `/tasks/{id}/leave` | JWT | leave task/subtasks; last leaver → FREE (scoped notifications) |
| GET `/tasks/assignedTo/{userId}` | NONE | tasks visible to user = own + subtask work + **FREE in same branch+dept** |
| GET `/tasks/createdBy/{userId}` | NONE | tasks created by user (manager dashboard) |
| GET `/tasks/{id}/review` | JWT + `assertManager` | **review payload**: `{task, amendment, originalContract}` |
| POST `/tasks/{id}/approve` | JWT + `assertManager` | full existing accept flow + amendment `Contract.status → APPROVED` + notifications |
| POST `/tasks/{id}/return` | JWT + `assertManager` | DONE → IN_PROGRESS, DONE subtasks → IN_PROGRESS; amendment stays PENDING_APPROVAL |

## 8.6 Contracts & amendments — `ContractController` (`/api/contracts`)

| Method & Path | Auth | Notes |
|---|---|---|
| GET `/contracts` | **NONE** | all contracts |
| GET `/contracts/{id}` | **NONE** | |
| GET `/contracts/creating/{companyId}` | **NONE** | first CREATING contract for company |
| GET `/contracts/updating/{companyId}` | **NONE** | all UPDATING contracts for company |
| POST `/contracts` | JWT (log only) | raw entity create |
| POST `/contracts/upload` | REQ | multipart `companyId`,`type`,`file`; CREATING→CreationContract, UPDATING→EditingContracts, OTHER→OtherTypesContracts; **status hardcoded APPROVED**; legacy path used by old companies UI (UPDATING uploads a **JSON** file) |
| POST `/contracts/amendments/generate` | REQ | **the AI-amendment persistence endpoint.** Renders PDF via `PdfService`, saves under `EditingContracts/`, persists `Contract(UPDATING, **PENDING_APPROVAL**, ocrData=PdfRequest JSON, task_id optional)` |
| PUT `/contracts/{id}` | JWT (log only) | raw overwrite |
| DELETE `/contracts/{id}` | JWT (log only) | hard delete |

## 8.7 PDF — `PdfController` (`/api/pdf`)

| Method & Path | Auth | Notes |
|---|---|---|
| POST `/pdf/generate` | **NONE** | body = `PdfRequest` (§7); returns `application/pdf` bytes (attachment `report.pdf`). Used by old AI-amendment UI for preview/download |

## 8.8 Files — `FilesController` (`/api/files`)

| Method & Path | Auth | Notes |
|---|---|---|
| GET `/files/file?path=...` | REQ (throws 401) | streams any file under `../FileSystem`; traversal guard; **no role/ownership scoping** |
| POST `/files/uploadToCompanyFolder` | REQ | writes into `<companyFolder>/OtherTypesContracts/` — **known bug: saved file is 0 bytes** (double `Files.copy`, §31) |

## 8.9 OCR — `OcrController` (`/api/ocr`)

| Method & Path | Auth | Notes |
|---|---|---|
| POST `/ocr/extract` | **NONE** | validates PDF, `OcrService.processPdf` (page pairs → external `/predict`) + `AssemblyService.assemble` → `ContractDocument`; writes `<fileId>_result.json` to process CWD |
| POST `/ocr/extract2` | **NONE** | **mock**: ignores upload, returns `ContracteService.getcontracte("file_1")` from `../FileSystem/fakeData/` (folder absent in repo) |
| GET `/ocr/health` | **NONE** | `pingCloud()` |
| POST `/ocr/test-predict` | **NONE** | test passthrough to OCR service |

## 8.10 Comments — `CommentController` (`/api/comments`)

| Method & Path | Auth | Notes |
|---|---|---|
| GET `/comments` | **NONE** | |
| GET `/comments/{taskId}` | **NONE** | comments of a task |
| POST `/comments` | **NONE** | identity from **client-supplied `createdById`** (spoofable); creates `TaskComment`; notifies task assignee + creator (`COMMENT_ADDED`) |
| DELETE `/comments/{id}` | JWT (log only) | no ownership check |

## 8.11 Notifications — `NotificationController` (`/api/notifications`)

| Method & Path | Auth | Notes |
|---|---|---|
| GET `/notifications/user/{userId}` | **NONE** | any user's notifications |
| PUT `/notifications/{id}/read` | **NONE** | marks read |

## 8.12 Approvals / Roles / Permissions / Misc (mostly scaffolding)

- `ContractApprovalController` `/api/contract-approvals` and `TaskApprovalController`
  `/api/task-approvals`: full CRUD, **NONE** auth, raw-entity bodies. Unused by the frontend.
- `RoleController` `/api/roles`: CRUD, **NONE** (world-writable). GET used by dashboard/employee UI.
- `PermissionController` `/api/permissions`, `PermissionRoleController` `/api/permission-roles`:
  CRUD, **NONE**. Unused by frontend.
- `UserRoleController` `/api/user-roles`: GET list (REQ, owner/BM only), GET one (REQ +
  canViewUser), POST (REQ + `canChangeUserRole`), DELETE (REQ; removing OWNER requires owner).
  Unused by frontend.
- `ReportingController` `/api/reportings`: CRUD, **NONE**. Unused by frontend.
- `LedgerController` `GET /api/ledger`: **NONE**, hardcoded demo rows (POJO, no DB).
- `ActivityLogController` `/api/activity-logs`: GET list (REQ + `canViewUserActivity`),
  GET by company (REQ + `canViewCompany`), **POST `/activity-logs/amendment`** (JWT only) —
  written by the old AI-amendment UI with `{companyId, companyName, sections[]}`.
- `AttendanceController` `/api/attendance`: own `authenticate()` (JWT + cache); record roles
  checked by raw names `employee`/`headdepartment`, manage roles `owner`/`headbranch`
  (⚠ naming mismatch risk, §31). Endpoints: POST `/start`, POST `/end`,
  GET `/today/me`, GET `/today` (managers), GET `/employee/{id}`, GET `/employee/me`.
- `GuideController` `/api/guides`: authenticated reads (published), editor-role writes
  (owner/headbranch/headdepartment variants), draft/published status.

---

# 9. Frontend Architecture

- **Routing:** static `<Routes>` in `App.jsx`; guards via `<ProtectedRoute>` (verify token via
  `GET /auth/verify`; optional `allowedRoles` check against `localStorage.user`).
- **Layout:** every page wraps itself in `MainLayout` (`{title, subtitle, actions, children}`)
  which renders `Sidebar` (role-filtered) + `TopBar` (theme toggle, notifications bell,
  profile) + content dock. RTL everywhere.
- **State:** per-page `useState`/`useEffect`; no router loaders, no query cache. Deep-linking
  convention: `location.state.openTaskId` opens a task modal (from notification clicks).
- **API layer:** `src/api/*.js` modules (see §23). `ollamaClient.js` is the only non-backend
  API module (direct Ollama calls).
- **Error handling:** `utils/apiError.js getApiErrorMessage` reads `response.data.error /
  .message`; pages surface Arabic errors in red banners (`text-danger bg-badgeRedBg`).
  axios 401 → clear session + redirect to `/`.
- **Role-based rendering:** `utils/roles.js` helpers (`isOwner`, `isBranchManager`,
  `isDepartmentManager`, `isEmployee`, `canManageEmployees`, `canManageDepartments`,
  `canCreateCompany`, `canEditTask`, ...) based on `localStorage.user`.
- **Loading states:** local spinners (`Loader2`), `TableSkeleton`/`CardSkeleton` (HrShared).

---

# 10. Frontend Route Map

From `App.jsx` (component paths relative to `src/`):

| Route | Component | Guard | Purpose | Key APIs |
|---|---|---|---|---|
| `/` | `features/login/LoginPage` | – | login (+ auto-redirect if token valid) | `login`, `verify`, `getEmployeeProfile` |
| `/Dashboard` | `features/dashboard/pages/DashboardPage` | ProtectedRoute | KPI dashboard (7 API calls) | users, departments, branches, roles, companies, tasks, contracts |
| `/branches` | `features/branches/pages/BranchesPage` | ProtectedRoute + self-guard (owner only) | branch cards | `fetchBranches` |
| `/branches/:branchId/review` | `features/branches/pages/BranchReviewPage` | ProtectedRoute + self-guard (owner only) | branch employees/companies (client-side filtering) | branches, users, companies |
| `/companies`, `/companies/company/:companyId`, `/companies/company/:companyId/type/:type`, `.../type/:type/Ai`, `.../type/:type/pdf/:pdfId` | `features/companies/pages/CompaniesPage` → `ContractBrowser` | ProtectedRoute | **old companies module**: OCR browser + amendment AI v1 | companies, contracts, files, pdf/generate, contracts/amendments/generate, activity-logs/amendment |
| `/companies/company/:companyId/type/amendment/pdf/:pdfId` | `features/companies/components/PdfPage` | ProtectedRoute | standalone amendment PDF page (**renders "unfinshed"**, §31) | contracts/{id}, files/file |
| `/companies2` | `features/companies2/components/CompanyList` | ProtectedRoute | company list (new module) | companies |
| `/companies2/:id` | `features/companies2/components/CompanyDetailsPage` | ProtectedRoute | company details → contract workflows | companies, contracts |
| `/companies2/:id/creating` | `features/companies2/components/CreatingContracte` | ProtectedRoute | عقد التأسيس view (عرض البيانات / عرض ملف PDF) | files (`creatingContract.pdf`, `ocrData.json`) |
| `/companies2/:id/updating` | `features/companies2/components/UpdateingConracte` | ProtectedRoute | amendments list + view (JSON → FinalContractReview; PDF → iframe modal) | contracts/updating/{id}, files/file |
| `/companies2/:companyId/updating/new` | `features/companies2/components/CreateUpdatingContractPage` | ProtectedRoute | **AI amendment creation** (article pick, Ollama streaming, FinalContractReview save) | `ollamaClient`, `generateAmendmentContract`, contracts/creating |
| `/Documents` | `features/documents/pages/DocumentsPage` | ProtectedRoute | static placeholder | – |
| `/profile/:id` | `features/employees/pages/EmployeeProfilePage` | ProtectedRoute | employee profile + own attendance | users/{id}/profile, attendance |
| `/EmployeeProfile/:id` | redirect → `/profile/:id` | ProtectedRoute | legacy | – |
| `/EmployeeTasks` | `features/tasks/pages/EmployeeTasksPage` | ProtectedRoute | Kanban tasks (employees + managers) | tasks (GET/PUT), subtask ops, claim/leave, comments |
| `/ActivityHistory` | `features/activityLogs/pages/ActivityHistoryPage` | ProtectedRoute | activity log list | activity-logs |
| `/ContractBrowser` (+ subpaths) | redirect → `/companies...` | ProtectedRoute | legacy redirect | – |
| `/EmployeeManagement` | `features/employees/pages/EmployeeManagementPage` | ProtectedRoute `allowedRoles=[OWNER, BRANCH_MANAGER, DEPARTMENT_MANAGER]` | employee CRUD | users, departments, branches, roles |
| `/AssignedTasks` | `features/tasks/pages/AssignedTasksDashboard` | same 3 roles | manager task dashboard + review queue | tasks/createdBy, updateTask, deleteTask |
| `/review/:taskId` | `features/tasks/pages/ReviewTaskPage` | same 3 roles | **manager review page** (accordions, approve/return) | tasks/{id}/review, /approve, /return |
| `/attendance` | `AttendanceRouteGuard` → `AttendancePage` | 3 roles + inner guard (`owner`,`headbranch`) | attendance monitor | attendance/today, /employee/{id} |
| `/EmployeeGuide` (+`/:id`, `/admin`, `/admin/:id`) | `features/guides/pages/EmployeeGuidePage` | 3 roles | guides list/details/editor | guides |
| `/Departments` | `features/departments/pages/DepartmentsPage` | `[OWNER, BRANCH_MANAGER]` | department CRUD | departments |

Backend routes without a frontend page: `/auth/register` UI (register actually posts `/users`),
reporting, permissions, user-roles, task/contract approvals, ledger.

---

# 11. Authentication and Authorization

## Login → session

1. `LoginPage` → `login({email, password})` → `POST /auth/login` → `{user: UserDto, token}`.
2. Stores `localStorage.authToken = token`, then calls `getEmployeeProfile(user.id)` and stores
   the **profile** in `localStorage.user` (this is why `user` contains branch/department/role
   fields — it is the profile payload, not `UserDto`).
3. `navigate('/Dashboard')`.

## Token mechanics

- HS256 JWT (`JwtService`): subject = email, claim `userId`, 24h expiry, secret from
  `jwt.secret`.
- **Single-session:** `TokenCacheService` keeps one token per user id in memory. Every `REQ`
  check requires the presented token to equal the cached one → new login kills the old
  session; backend restart logs everyone out.
- axios attaches `Bearer <authToken>` to every request; 401 → wipe + redirect to `/`.
- `ProtectedRoute` re-verifies via `GET /auth/verify` on mount of every guarded route.

## Frontend authorization (UI-only unless paired with backend checks)

- `ProtectedRoute allowedRoles` for manager routes (`/EmployeeManagement`, `/AssignedTasks`,
  `/review/:taskId`, `/attendance`, `/EmployeeGuide`), and `[OWNER, BRANCH_MANAGER]` for
  `/Departments`.
- Sidebar item filtering per role; inline self-guards in `BranchesPage`/`BranchReviewPage`;
  `AttendanceRouteGuard` (owner/headbranch only).

## Backend authorization

- `AuthorizationService` (all checks manual, no annotations):
  - `requireAuthenticatedUser` — JWT + cache + user exists.
  - `getUserRole` → `SystemRole` (owner/headBranch/headDepartment/employee).
  - `getUserBranchId/getUserDepartmentId` — from primary `EmployeeAssignment`.
  - `canViewUser/canManageUser/canChangeUserRole`, activity scoping.
  - Company: `canViewCompany/canManageCompany/canCreateCompany`.
  - **Task assignment:** `validateTaskAssignment(callerId, branchId, departmentId, assignedToId)` —
    employee must belong to the selected branch AND department; department must belong to the
    branch; caller-role scope (OWNER global, BM own branch, DM managed departments, EMPLOYEE
    forbidden); non-owners cannot assign to OWNER. Arabic error messages.
  - `canEditTask/canDeleteTask` — **creator only**; `canChangeTaskStatus` — assigned user only;
    `canViewTask`.
- `TaskService.assertManager` — manager set `{owner, manager, headbranch, headdepartment}`.
- `applyParentStatusChange` — ACCEPTED requires manager + previous DONE; ACCEPTED is terminal.

## ⚠ Frontend-only / missing protection (documented, not fixed)

See §25 "Known Security Concerns" — several controllers have no auth at all (notifications,
comments, contracts reads, OCR, roles CRUD, approvals, reporting, permissions, branches/{id},
departments/{id}, `/pdf/generate`, task GET endpoints), and `GET /users/{id}/profile`-shaped
data stored in localStorage drives UI role decisions.

---

# 12. Task Management System

Implementation: `TaskService` (≈900 lines), `TaskController`, `TaskRepository`,
`TaskResponse`, frontend `EmployeeTasksPage`, `AssignedTasksDashboard`, `TaskDetailsModel`,
`ReviewTaskPage`.

## TaskStatus (exact semantics)

| Status | Meaning | Set by |
|---|---|---|
| `PENDING` | assigned, not started | default on create; reset after content edits |
| `IN_PROGRESS` | work started (or returned from review) | employee `PUT {status}` (no-subtask tasks), subtask start, manager return |
| `DONE` | finished, **waiting for manager review** | employee status update, or all subtasks DONE (sync) |
| `ACCEPTED` | manager approved — **terminal** | manager only, from DONE only |

`FREE` is **not** a status — it is the computed `TaskResponse.free` flag
(parent unassigned AND no live subtask with an assignee whose status ≠ DONE).

## Parent status sync (`syncParentStatus`)

If the task has live subtasks: all DONE → `DONE`; any started → `IN_PROGRESS`; else `PENDING`.
Skipped entirely when the task is ACCEPTED. Parent status is therefore **derived** from
subtasks whenever subtasks exist (`applyEmployeeStatusUpdate` even rejects employee status
changes on subtask-driven tasks: "Parent task status is driven by subtasks").

## State machine

```
            createTask
                │
                ▼
             PENDING ──(employee: PUT status)──► IN_PROGRESS ──(employee / last subtask DONE)──► DONE
                ▲                                   ▲  ▲                                    │
                │ (manager content edit resets)      │  └──── manager "return" (تعديل) ───┘
                │                                   │                                        │
                └───────────────────────────────────┘                            manager approve (قبول)
                                                                                          │
                                                                                          ▼
                                                                                     ACCEPTED (terminal)
```
Invalid transitions enforced in `applyParentStatusChange`: anything → ACCEPTED requires manager
+ DONE; ACCEPTED → anything is rejected; subtask-driven parents reject employee status writes.

## Creation (`createTask`)

`POST /api/tasks` (manager only). Validates title/assignee/creator/verification;
`validateTaskAssignment` for parent **and each subtask assignee** (branch+dept+role scope);
parent dueDate must be ≥ latest subtask dueDate (Arabic error); subtasks default assignee =
parent assignee; notifications: parent assignee ("New task") + each distinct subtask assignee;
activity log TASK/CREATE.

## Editing (`updateTask` — dual mode)

- **Employee callers:** only `status`, only on tasks they're assigned to/working; rejected for
  subtask-driven tasks; cannot set ACCEPTED.
- **Manager callers:** creator-only (`canEditTask` → "فقط منشئ المهمة يمكنه تعديلها").
  Reassignment validates scope (dept ⇒ branch fallback via `department.branch`), and on change
  **cascades the new assignee to ALL live subtasks** (`cascadeParentAssignment` — the
  "option one" behavior). Subtask list sync (`syncSubTasks`) resets changed subtasks to
  PENDING. Content edit (title/description) by a manager resets the whole task + subtasks to
  PENDING (unless ACCEPTED). New DONE → creator notification ("المهمة بانتظار مراجعتك",
  `TASK_COMPLETED`) — added with the review feature.

## Deletion — manager only, hard delete (also removes TaskApprovals).

## Manager accept (قبول المهمة)

`PUT /api/tasks/{id}` with `{"status":"ACCEPTED"}` — manager + DONE-only + creator-only edit
rule apply. The **review page's** `POST /api/tasks/{id}/approve` reuses exactly this flow
(`TaskReviewService.approveTask` calls `taskService.updateTask`) and additionally marks the
linked amendment contract APPROVED.

## Comments — `TaskComment` via `/api/comments` (unauthenticated); shown in
`TaskDetailsModel` and `ReviewTaskPage`; `COMMENT_ADDED` notifications to assignee/creator.

## Review flow (added with the amendment review feature)

`GET /api/tasks/{id}/review` returns `{task, amendment, originalContract}`:
- amendment resolution: contract with `task_id = task` (latest) → else company's latest
  `UPDATING` + `PENDING_APPROVAL` → else latest `UPDATING` for the company;
- originalContract: company's latest `CREATING`.
Manager actions: approve (§ above) or return (`POST /tasks/{id}/return`: DONE → IN_PROGRESS,
DONE subtasks → IN_PROGRESS, amendment untouched, notifications "تم إعادة المهمة للتعديل").
UI: `TaskDetailsModel` shows a single **عرض المهمة** button for managers on DONE tasks,
navigating to `/review/:taskId`.

---

# 13. Subtask System

Implementation: `SubTask` entity, `SubTaskRequest/Response`, `TaskService` subtask methods,
`SubTaskFormModal` + task form in `EmployeeTasksPage`, subtask cards in `TaskDetailsModel` /
`ReviewTaskPage`.

- **Statuses** (`SubTaskStatus`): `PENDING` → `IN_PROGRESS` → `DONE` (via
  `POST .../subtasks/{id}/start` and `.../complete`, assignee-only, enforced transitions).
- **Creation:** only within the task aggregate (cascade ALL, orphanRemoval). Title + dueDate +
  assignee required. Default assignee = parent task assignee.
- **Assignment rules (backend-enforced):**
  - On `createTask`: every subtask assignee passes `validateTaskAssignment` (branch+dept+role).
  - On `addSubTask` / `updateSubTask` (added with the review feature):
    `validateSubTaskScope` validates the assignee against the **task's** department+branch.
  - Frontend: the "+ إضافة مهمة فرعية" button is disabled until **both** branch and department
    are selected; `SubtaskFormModal` receives only `availableEmployees` (the branch+dept
    filtered list).
- **Editing:** manager-only endpoints; content/assignee change resets the subtask to PENDING.
- **Parent relationship:** parent status is derived from subtasks (all DONE → parent DONE).
- **Multi-employee:** a parent can hold subtasks for several employees (all validated to the
  same branch+dept via the parent's department). `workingEmployees` = distinct assignees of
  parent + non-DONE subtasks.
- **FREE subtasks:** created when their assignee leaves (`leaveTask` nulls the leaver's
  subtasks). A free subtask shows a **استلام** button (`claimFreeSubTask`) only when the task
  is free or the viewer already works on it, and backend claim enforces branch+dept scope.
- **Reassignment:** parent reassignment cascades all live subtasks to the new assignee;
  subtask-level edit resets PENDING on change.
- **Deletion:** `orphanRemoval` + explicit `subTaskRepository.delete` in sync path.

---

# 14. Branch and Department Filtering

Frontend (`EmployeeTasksPage` task form — the reference implementation):

```
openCreateForm → fetchBranches()
   → branch select (locked to caller's own branch for BM/employee; owner free)
handleBranchChange → fetchDepartments(branchId)          (dept select disabled until branch)
handleDepartmentChange → fetchUsers({branchId, departmentId})   (GET /users?branchId=&departmentId=)
   → availableEmployees (owners filtered out for non-owner callers)
   → parent assignee select + SubtaskFormModal employee list both read ONLY this list
"+ إضافة مهمة فرعية" disabled until form.branchId && form.departmentId
```

Backend enforcement (the part that must never be trusted to the frontend):

- `GET /users?branchId=&departmentId=` — `UserController.getAllUsers` first scopes the user
  set by caller role, then filters by branch/department using
  `AuthorizationService.getUserBranchId/getUserDepartmentId` (primary `EmployeeAssignment`).
- `validateTaskAssignment(callerId, branchId, departmentId, assignedToId)` —
  employee-branch match, employee-department match, branch↔department consistency, caller role
  scope. Arabic errors: "الموظف المحدد لا ينتمي إلى الفرع المختار" / "...القسم المختار" /
  "لا يمكن لمدير الفرع إنشاء مهمة في فرع آخر" etc.
- Subtask endpoints validate against the **task's** department (`validateSubTaskScope`).

---

# 15. FREE Task / FREE Subtask Logic

Definition (`TaskResponse.isFree`): `task.assignedTo == null` **and** no live subtask with an
assignee whose status ≠ DONE.

## Leaving (`POST /api/tasks/{id}/leave`, `TaskService.leaveTask`)

1. Pessimistic lock (`findByIdForUpdate`); caller must be "working on" the task.
2. Leaver's live subtasks → `assignedTo = null`; parent assignee nulled if it was the leaver.
3. If other workers remain → they + creator get a "now free for the remaining task employees"
   notification; the task is **not** free (remaining assignees hold it).
4. If nobody remains → task is FREE; `notifyTaskBecameFree` notifies the creator **and only
   employees of the task's branch+department** (`EmployeeAssignment` rows in that department
   with matching branch; tasks without a department fall back to notifying all role=`employee`
   users — legacy behavior preserved).

## Visibility (backend)

`TaskRepository.findVisibleToAssignee(userId)` returns a task if:
- it's assigned to the user, **or**
- the user is assigned to a live non-DONE subtask, **or**
- the task is FREE **and** (task.department is null **or** the user has an
  `EmployeeAssignment` in the task's department **and** its branch, endDate null/future).

Consumed by `GET /tasks/assignedTo/{userId}` and — since the review feature — by `GET /tasks`
for **employee** callers (managers still get everything). `TaskReviewService`/`EmployeeProfileService` reuse it too.

## Visibility (frontend)

`EmployeeTasksPage.isTaskVisibleToUser` — assigned-to-me / working-employees / free (scoped
client-side via each user's `branchId`+`departmentId` from `/users`; managers bypass; tasks
without a department stay open) / assignee-rank-lower-than-mine (legacy manager visibility:
owner 4 > headbranch 3 > manager 2 > employee 1).

## Claiming

- `POST /tasks/{id}/claim` — lock, `isFree` re-check, **`assertFreeTaskScope`** (manager OR
  same branch+dept, else `SecurityException`), sets parent assignee, claims unassigned
  non-DONE subtasks, notifies creator.
- `POST /tasks/{id}/subtasks/{subTaskId}/claim` — free subtask only; same scope check when the
  task is free; also attaches the claimer as parent assignee if the parent is unassigned.
- Claimed tasks keep their previous statuses/progress (no reset).

## Multi-employee invariant

Partial leave must never free the whole task while another employee still holds non-DONE
subtasks — covered by `TaskFlowRegressionTest.testPartialLeaveNotFree`.

---

# 16. Notification System

**Single notification system exists. Future features MUST reuse it — do not create another.**

- Entity `Notification` (`notifications`): `title`, `message`, `isRead`, `type`
  (`NotificationType`: `TASK_ASSIGNED`, `TASK_COMPLETED`, `COMMENT_ADDED`, `PROJECT_ASSIGNED`),
  `referenceId` (task id), `user` FK, createdAt.
- Service `NotificationService.createNotification(userId, title, message, type, referenceId)`.
- API: `GET /api/notifications/user/{userId}` (unauthenticated), `PUT /api/notifications/{id}/read`.
- Frontend: `TopBar` bell — `fetchNotifications(currentUser.id)`, unread count =
  `!n.read` filter, click marks read then navigates:
  `TASK_ASSIGNED` → `/EmployeeTasks` with `state.openTaskId`; `COMMENT_ADDED` →
  `/profile/{owner id}` or `/EmployeeTasks`. (`TASK_COMPLETED` currently has no click handler.)

| Event | Recipient(s) | Type |
|---|---|---|
| Task created / reassigned / subtask assigned | assignees | TASK_ASSIGNED |
| Free task claimed / subtask claimed / leave (remaining workers) | creator / workers | TASK_ASSIGNED |
| Task became FREE | creator + same-branch+dept employees (or all employees when no department) | TASK_ASSIGNED |
| Task reached DONE (status update or last subtask completed) | creator | TASK_COMPLETED |
| Manager approved (review page) | assignee + workers | TASK_COMPLETED |
| Manager returned for modification | assignee + workers | TASK_ASSIGNED |
| Comment added | task assignee + creator (unless self) | COMMENT_ADDED |

---

# 17. Contract Management

- **Incorporation Contract (عقد التأسيس, `ContractType.CREATING`)** — created either by
  `POST /api/companies/with-contract` (multipart PDF + OCR JSON during company creation; status
  APPROVED) or `POST /api/contracts/upload`. Files: `{company}/CreationContract/…`;
  the frontend additionally expects `CreationContract/creatingContract.pdf` and
  `CreationContract/ocrData.json` (`fetchCompanyCreating` — **hardcoded filenames**).
  Structured content = `ContractDocument`-shaped JSON in `ocrData` with
  `articles: [{id, value}]`, `law_reference`, company metadata.
- **Amendment Contract (عقد تعديل, `ContractType.UPDATING`)** — two persistence paths:
  1. **AI flow (current):** `POST /api/contracts/amendments/generate` → PDF rendered server-side
     → `EditingContracts/<file>.pdf` → `Contract(UPDATING, PENDING_APPROVAL, ocrData=PdfRequest
     JSON, task_id?)`. Becomes APPROVED only via the review page's approve action.
  2. **Legacy upload flow (old companies UI):** `uploadContract(...)` POSTs a **JSON blob** to
     `/contracts/upload` (status APPROVED, filePath ends `.json`); `UpdateingConracte` renders
     those with `FinalContractReview` in read-only mode.
- **Other (`OTHER`)** — generic uploads in `OtherTypesContracts/`.
- **Display:** `CreatingContracte` (data view from `ocrData.json` articles + PDF iframe),
  `UpdateingConracte` (list + PDF iframe modal or JSON review), `ContractBrowser`/`PdfViewer`
  (old module), `ReviewTaskPage` (review context with قبل/بعد التعديل toggle).
- **Immutability:** no code path modifies an existing CREATING contract's file or ocrData;
  amendments are separate rows/files. "The original contract is immutable" is an
  **implementation-derived rule** (nothing writes to CREATING contracts after creation).

---

# 18. AI Amendment System

Two generations of the feature exist and are both live:

## A) companies2 flow (current, route `/companies2/:companyId/updating/new`)

`CreateUpdatingContractPage.jsx`:

1. **Load original contract:** ⚠ currently from a **hardcoded local mock constant**
   `getCreatingContractByCompanyId` inside the file (the real API
   `getCreatingContractByCompanyId` in `api/contracts.js` exists but is shadowed).
   Articles come from `contract.articles[{id, value}]`.
2. **Article picking:** manual `ArticlePicker` dropdown (search). A "smart pick" helper
   (`smartPickArticle`) throws "not connected yet" in this page (the working smart pick lives
   in the old feature, below).
3. **AI modification:** `modifyArticleWithAI` in this page is also a **stub** returning
   `"this is model responce"`; the page streams via `ollamaClient.generateResponseStream` in
   its `handleModifyArticle` flow (prompt = `تعديل رقم N : <user instruction>`,
   model `qwen-local`).
4. **Final review:** `FinalContractReview` (`react-markdown` rendering, html2pdf.js download,
   save).
5. **Save:** `saveFinalContract` → `generateAmendmentContract({companyId, taskId?, fileName, pdf})`
   → `POST /api/contracts/amendments/generate` → backend renders + persists as
   `PENDING_APPROVAL` (see §8.6). `taskId` is read from `?taskId=` query param if present;
   otherwise the review page falls back to the company's latest pending UPDATING contract.

## B) old companies AI flow (route `/companies/.../type/:type/Ai`)

`features/companies/components/createAmendmentAi/`:

- `useCreateAmendmentAiForm` — sections state `{id, selectedArticleId, selectedArticleTitle,
  beforeText, afterText, amendmentTitle, modelOutput, embeddingScore, prompt}`;
  `getCachedEmbedding` (in-memory Map + in-flight dedupe).
- **Smart article pick** (`ArticleSection.handleSmartPick`): embeddings via
  `POST {VITE_OLLAMA_URL}/embeddings` (`qwen3-embedding:0.6b`), **cosine similarity computed in
  the browser**, threshold 0.5, top-3 suggestions, UI displays `round(score*100)+30` for the
  best hit (deliberate display bump).
- **Generation:** `generateResponseStream(buildCatInstruction(n, prompt), beforeText, onChunk)`
  → Ollama `/generate` (`stream:true`, NDJSON); `<think>` blocks stripped live
  (`stripThinkingContent`); output normalized (`normalizeCatOutput` handles fenced JSON with
  Arabic keys `amendment_title`/`after_text`, HTML stripping, label removal).
- **PDF preview/download:** `amendmentPdfUtils.generateAmendmentPdfBlob` →
  `POST /api/pdf/generate` (blob) — server-side render; intro text sourced from the company's
  CREATING contract `ocrData`.
- **Persist:** `saveAmendmentContract` → `POST /api/contracts/amendments/generate`
  (no `taskId` in this flow); then `POST /api/activity-logs/amendment` for the audit trail
  (`AI_AMENDMENT` entity log).

## Where to change AI behavior

- Prompt text/model: `Frontend/src/api/ollamaClient.js` (`GENERATION_MODEL`, prompt template in
  `generateResponse`/`generateResponseStream`); instruction wrapper:
  `features/companies/components/createAmendmentAi/amendmentUtils.js buildCatInstruction`.
- Similarity threshold & scoring display: `ArticleSection.jsx` (`minSimilarity = 0.5`).
- Output normalization: `amendmentUtils.js` (`stripThinkingContent`, `normalizeCatOutput`).
- The **backend never calls an LLM**; changing "the AI" means changing the frontend client or
  the Ollama server-side models.

---

# 19. PDF and File Handling

## Storage (`FileService`, root `../FileSystem` relative to the backend CWD)

- `createFolder(relativeName)`, `saveFile(relativePath, MultipartFile)` (REPLACE_EXISTING),
  `saveJsonFile(...)`, `saveBytes(...)`.
- Per-company folders: `{id} - {name}/CreationContract | EditingContracts | OtherTypesContracts`.
- Current repo snapshot contains only one company folder (`36 - شركة النور للتجارة والاستيراد`).
  The `fakeData/` folder referenced by `ContracteService` is **absent** (mock endpoint would fail).

## Serving

`GET /api/files/file?path=<relative>` — authenticated (no role scoping), traversal-guarded,
content-type probed. Frontend `getFileFromPath(path)` → Blob → `URL.createObjectURL` →
**`<iframe>`** (the de-facto viewer: `CreatingContracte`, `UpdateingConracte` PDF modal,
`ReviewTaskPage` `PdfFrame`).

## Generation

- **Server-side (canonical):** `PdfService.generateAmendmentPdf(contractTitle, companyName,
  companyLegalLine, introText, companyCapital, contractDate, partners, sections)` —
  Thymeleaf `templates/pdf-template.html`, flexmark markdown-table parsing, OpenHTMLtoPDF with
  ICU bidi (RTL) + `fonts/NotoNaskhArabic-Regular.ttf`. Exposed by `POST /api/pdf/generate`
  (bytes) and used internally by `/contracts/amendments/generate`.
- **Client-side (download only):** `FinalContractReview` uses `html2pdf.js` on a rendered DOM node.

## Rendering components (reuse guidance)

- **Working pattern:** fetch blob + `<iframe>` (see `PdfFrame` in `ReviewTaskPage.jsx`).
- `react-pdf` is installed and `PdfPage.jsx` sets the pdf.js worker, **but its `<Document>` JSX
  is commented out** — the routed page shows the literal text "unfinshed (hard coded message)".
  Do not treat it as a working viewer.
- `PdfViewer.jsx` (old companies) is **not** a PDF renderer — it shows OCR structured data.

---

# 20. Companies Module

Two parallel modules, both routed:

## Old — `features/companies` (sidebar: "الشركات الوحشة" via `/ContractBrowser` redirect)

- `CompaniesPage` → `ContractBrowser` — a URL-param-driven state machine
  (`companies → contractTypes → pdfList | pdfViewer | amendmentAi`).
- `companyWorkflow.js` maps `company.contracts` (populated server-side) into
  establishment/amendment/other buckets; parses each `contract.ocrData` JSON.
- `AddCompanyModal` — 3-step wizard: upload PDF → `uploadPdfForOcr` → `POST /api/ocr/extract` →
  `createCompanyFromOcr` → `POST /api/companies/with-contract` (creates company + folders +
  CREATING contract). ⚠ crashes on open (missing `useMemo` import, §31).
- `UploadModal` → `uploadContract` (legacy JSON-for-UPDATING flow).
- `PdfViewer` renders OCR data + article overlay; article click → `ChatModal` (Ollama Q&A).
- `CreateAmendmentAiPageView` — the v1 AI amendment page (§18B).

## New — `features/companies2` (sidebar: "الشركات الحلوة")

- `CompanyList` (`/companies2`) → `CompanyDetailsPage` (`/companies2/:id`) → three flows:
  - `CreatingContracte` (`/creating`) — عقد التأسيس view; the visual reference for the
    "عرض البيانات / عرض ملف PDF" two-button pattern.
  - `UpdateingConracte` (`/updating`) — amendments list; view handles JSON (legacy) and PDF.
  - `CreateUpdatingContractPage` (`/updating/new`) — AI amendment creation (§18A).
- `AddCompanyModel.jsx` also exists in this folder (naming inconsistency with the old
  `AddCompanyModal`); usage not verified.

## Company ↔ Contract ↔ Task ↔ Amendment relationship

```
Company 1──* Contract(CREATING = عقد التأسيس الأصلي, immutable)
Company 1──* Contract(UPDATING = عقد تعديل, PENDING_APPROVAL → APPROVED)
Task (companyId set, department set) 1──1* Contract(UPDATING, task_id)   [V3 FK]
Manager reviews task DONE → approve: task ACCEPTED + amendment APPROVED
```
A task created for a company's amendment review is linked to its amendment via
`contracts.task_id`; when absent, review resolution falls back to the company's latest
pending UPDATING contract (**inferred from implementation**).

---

# 21. Important UI Components

| Component | File | Purpose / notes |
|---|---|---|
| `MainLayout` | `shared/layout/MainLayout.jsx` | props `{title, subtitle, actions, children}`; wraps Sidebar+TopBar+content; `hidePageHeader` prop passed by some pages is **not** implemented (ignored) |
| `Sidebar` | `shared/layout/Sidebar.jsx` | role-filtered nav; brand "CLARA"; logout clears localStorage and redirects (does **not** call the logout API) |
| `TopBar` | `shared/layout/TopBar.jsx` | theme toggle, notifications bell (fetch/mark-read/navigate), profile link |
| `Modal` | `shared/components/HrShared.jsx` | portal modal (`title, subtitle, onClose, footer, size, busy, bodyScroll`); used by TaskDetailsModel, task form, subtask form, attendance history |
| `PageStatCard`, `Avatar`, `StatusBadge`, `TableSkeleton`, `CardSkeleton` | `HrShared.jsx` | shared atoms (the *used* ones; `SlideOver`, `BudgetBar`, `PriorityBadge` are exported but unused) |
| `TaskDetailsModel` | `features/tasks/pages/TaskDetailsModel.jsx` | task popup: description, assignee, dueDate, subtask cards (start/complete/claim), comments + add box; manager footer (edit/delete/accept; **عرض المهمة** when DONE) |
| `ReviewTaskPage` | `features/tasks/pages/ReviewTaskPage.jsx` | manager review page: task info, `AccordionCard`s عقد التعديل / عقد التأسيس, `ViewButtons` (عرض البيانات = `FileText` icon, عرض ملف PDF = `FileType`), `OriginalArticle` (قبل/بعد التعديل toggle), approve/return footer |
| `SubtaskFormModal` (+`DateTimeConfirmField`) | `features/tasks/components/SubtaskFormModal.jsx` | subtask create/edit with employee dropdown fed by branch+dept-filtered list |
| `KanbanColumn` / task cards | inside `EmployeeTasksPage.jsx` | PENDING/IN_PROGRESS/DONE columns, claim buttons for free tasks |
| `FinalContractReview` | `features/companies2/components/FinalContractReview.jsx` | amendment final preview (`react-markdown`, html2pdf download, onSave) — big (≈1450 lines) |
| `ContractBrowser` + `PdfList` + `PdfViewer` + `ArticleOverlay` + `ChatModal` | `features/companies/components/` | old module's browser/viewer/AI chat |
| `PdfPage` | `features/companies/components/PdfPage.jsx` | ⚠ react-pdf viewer with JSX commented out |
| `MicButton` + `useSpeechRecognition` | `shared/` | ar-EG dictation, used in AI article prompt + ChatModal |
| `ProtectedRoute` | `components/ProtectedRoute.jsx` | token verify + optional role gate |
| `DateTimeConfirmField` | exported from `SubtaskFormModal.jsx` | datetime picker used in task form |

Dead components (`NavBar`, `ResponsiveTable`, `components/StatusBadge`, `StatCard`,
`PrimaryButton`, `SlideOver`, `BudgetBar`, `useAsyncData`) — see §31.

---

# 22. Important Backend Services

| Service | Responsibilities | Main entities | Called by |
|---|---|---|---|
| `TaskService` | task/subtask CRUD, status transitions & sync, cascade reassignment, claim/leave, FREE logic, scope validation, notifications | Task, SubTask, User, Notification | TaskController, TaskReviewService |
| `TaskReviewService` | review payload (task + amendment + original contract), approve (reuse accept flow + amendment APPROVED), return | Task, Contract, Notification | TaskController |
| `AuthorizationService` | authentication (`requireAuthenticatedUser`), role/branch/dept resolution, all can* checks, `validateTaskAssignment` | User, Role, EmployeeAssignment, DepartmentManagerDepartment, Company, Task | most controllers |
| `AuthService` | register/login/verify/logout/change-password, `enrichUserDto` | User, Role, TokenCache | AuthController |
| `TokenCacheService` | in-memory single-session token store | — (memory) | AuthService, AuthorizationService, AttendanceController, GuideController |
| `PdfService` | amendment PDF rendering (Thymeleaf + flexmark + OpenHTMLtoPDF + Arabic RTL font) | — (bytes) | PdfController, ContractController |
| `FileService` | filesystem store under `../FileSystem` | — | CompanyController, ContractController, FilesController |
| `OcrService` | PDF → 200-DPI page images (PDFBox) → overlapping pairs to external `/predict` (WebClient, 300s timeout) | — | OcrController |
| `AssemblyService` | merge OCR chunks → `ContractDocument` (field voting, article merge by id, partial handling) | — (POJO) | OcrController |
| `ContracteService` | read `../FileSystem/fakeData/<name>.json` → `ContractDocument` (mock source) | — | OcrController (extract2) |
| `NotificationService` | create/list/read notifications | Notification | TaskService, TaskReviewService, CommentController |
| `ActivityLogService` | `logAction` audit writes (REQUIRES_NEW, swallow failures) | ActivityLog | most controllers/services |
| `EmailService` | temp-password email (Gmail SMTP) | — | UserController.createUser |
| `EmployeeProfileService` | profile aggregation (visible tasks, created tasks w/ comments, created contracts) | Task, Contract | UserController |
| `AttendanceService` | start/end/today/history with geolocation + worked minutes | Attendance | AttendanceController |
| `GuideService` | guides CRUD + published filter | Guide, GuideStep | GuideController |

---

# 23. Important Frontend API Functions

All in `Frontend/src/api/` (axios instance from `client.js`; base `VITE_API_URL`).

| Module | Functions → HTTP | Consumers |
|---|---|---|
| `auth.js` | `login` POST /auth/login; `register` POST **/users** (not /auth/register); `logout` POST /auth/logout + localStorage clear; `getCurrentUser` GET /auth/me; `verify` GET /auth/verify | LoginPage, ProtectedRoute |
| `client.js` | axios instance; request interceptor (Bearer), response interceptor (401 → wipe + redirect); **no default Content-Type** (needed for multipart) | all modules |
| `users.js` | `fetchUsers(params)` GET /users; `getUserById`; `getEmployeeProfile(id)` GET /users/{id}/profile; `addUser`, `updateUser`, `deleteUser` | Dashboard, EmployeeManagement, EmployeeProfile, task form |
| `tasks.js` | `fetchTasks` GET /tasks; `addTask` POST; `updateTask` PUT; `deleteTask` DELETE; `getTaskByAssignedToId` GET /tasks/assignedTo/{id}; `getTaskByCreatedById` GET /tasks/createdBy/{id}; `addSubTask/updateSubTask/deleteSubTask`; `startSubTask/completeSubTask`; `claimTask/claimSubTask`; `leaveTask`; `getTaskReview` GET /tasks/{id}/review; `approveTaskReview` POST /tasks/{id}/approve; `returnTaskReview` POST /tasks/{id}/return | tasks feature, profile, review page |
| `contracts.js` | `fetchContracts`; `getContractById`; `getCreatingContractByCompanyId` GET /contracts/creating/{id}; `getUpdatingContractByCompanyId`; `addContract`; `uploadContract` (multipart; UPDATING → JSON blob); `updateContract`; `deleteContract`; `generateAmendmentContract` POST /contracts/amendments/generate | companies (both), companyWorkflow, review flows |
| `companies.js` | `fetchCompanies`; `fetchCompanyById`; `fetchCompanyCreating(companyId, companyName)` GET /files/file ×2 (hardcoded `creatingContract.pdf` + `ocrData.json`); `uploadPdfForOcr`; `createCompanyFromOcr` | CreatingContracte, ReviewTaskPage, AddCompanyModal |
| `files.js` | `getFileFromPath(path)` GET /files/file (blob); `uploadFileToCompanyFolder` | all PDF viewers |
| `comments.js` | `addCommentToTask` POST /comments | TaskDetailsModel |
| `notification.js` | `fetchNotifications(userId)`; `markNotificationAsRead(id)` | TopBar |
| `branches.js` / `departments.js` | `fetchBranches`, branch CRUD / `fetchDepartments(branchId)`, dept CRUD | task form, management pages |
| `roles.js` | `fetchRoles` | Dashboard, EmployeeManagement, Profile |
| `activityLogs.js` | `fetchActivityLogs` | ActivityHistoryPage |
| `attendance.js` | `getToday`, `getEmployeeHistory`, `getMyToday`, `getMyHistory`, `startAttendance`, `endAttendance` | AttendancePage, EmployeeProfilePage |
| `guides.js` | `fetchGuides`, `fetchAdminGuides`, `fetchGuide`, `createGuide`, `updateGuide`, `deleteGuide` | EmployeeGuidePage |
| `ollamaClient.js` | `getEmbedding`; `generateResponse` (non-stream); `generateResponseStream` (NDJSON streaming) | ArticleSection, ChatModal, useCreateAmendmentAiForm |

**Unused API modules (zero imports):** `contractApprovals.js`, `employeeAssignments.js`,
`ledger.js`, `permissionRoles.js`, `permissions.js`, `reporting.js`, `taskApprovals.js`,
`userRoles.js` (identical CRUD scaffolds).

---

# 24. Error Handling and Validation

**Backend**
- Manual validation inside services (`IllegalArgumentException` → 400 by controller handlers,
  `IllegalStateException` → 409, `SecurityException` → 403, `ResponseStatusException` passthrough
  — see `TaskController.handle`). Arabic messages for business rules.
- `AuthorizationService.requireAuthenticatedUser` → 401. `ResponseStatusException` used widely.
- No global `@ControllerAdvice` found — each controller maps its own exceptions (most via
  private `handle()` helpers).
- No bean-validation annotations on DTOs despite `spring-boot-starter-validation` dependency.
- `server.error.include-message=always` exposes raw messages.
- `ContractController.generateAndSaveAmendmentContract` catches everything → generic
  "Failed to generate amendment contract" + stack trace to stdout.

**Frontend**
- `getApiErrorMessage(error, fallback)` — `response.data` (string) → `.message` → `.error` →
  `error.message` → fallback.
- Form validation is inline (`formErrors` maps with Arabic messages, e.g. task form requires
  branch/dept/employee).
- axios 401 interceptor: wipe `authToken`/`user`, redirect to `/`.
- AI errors: Ollama failures return Arabic fallback text ("تعذر الاتصال بخدمة الذكاء
  الاصطناعي حالياً...") instead of throwing in `generateResponse`; streaming throws.

**Database errors** surface as Spring `DataIntegrityViolationException` → mapped to a generic
409 in TaskController ("Task cannot be deleted because it is still referenced...").

---

# 25. Security Considerations

**Implemented protections**
- BCrypt password hashing; temp-password activation flow (`PENDING_VERIFICATION` → ACTIVE).
- HS256 JWT (24h) + in-memory single-session cache (`TokenCacheService`).
- Manual role/ownership checks in `AuthorizationService` + `assertManager` on task management.
- File-serving traversal guard (`FilesController`).
- `@Version` optimistic locking on `Task`.

**Known Security Concerns (documented as-is; not fixed)**

1. **Secrets committed to git:** DB password in `application.properties` **and**
   `docker-compose.yml`; Gmail app password; `jwt.secret`; `Frontend/.env` is committed.
2. **Unauthenticated endpoints** (no auth of any kind): contract reads (`GET /contracts`,
   `/contracts/{id}`, `/creating/{companyId}`, `/updating/{companyId}`), `POST /pdf/generate`,
   all OCR endpoints, notifications (any user's list readable by anyone), comments
   (incl. POST with client-supplied `createdById` — spoofable identity), roles CRUD,
   permissions CRUD, task/contract approvals CRUD, reporting CRUD, `GET /ledger`,
   `GET /branches/{id}`, `GET /departments/{id}`, and task GET endpoints
   (`/tasks/{id}`, `/tasks/assignedTo/{userId}`, `/tasks/createdBy/{userId}`).
3. **Weak fallback auth:** `GET /branches` and `GET /departments` return data even when the
   Authorization header is missing/invalid.
4. **JWT-parsed-only paths** (bypass the single-session cache): `GET /auth/me`, `/auth/verify`
   partially, `POST /api/activity-logs/amendment`, `CommentController` DELETE.
5. `AttendanceController` checks role names `owner/headbranch/employee/headdepartment` as raw
   strings — if seeded role names differ, access decisions may be wrong. Requires verification
   against the live `roles` table.
6. `FilesController` requires a valid token but has **no role/ownership scoping** — any
   authenticated user can read/write any company's files.
7. `@CrossOrigin(origins = "*")` on every controller.
8. Focus outlines are globally disabled in CSS (`outline: none !important`) — accessibility issue.
9. `server.error.include-message=always` leaks internal messages.
10. JWT secret is a hardcoded placeholder-style string; tokens are predictable if leaked.

---

# 26. Important Business Rules

All are **implementation-derived rules** (enforced in code) unless noted.

1. **The original Incorporation Contract (CREATING) is never modified** — no code path writes
   to an existing CREATING contract or its files; amendments are separate `UPDATING` contracts.
2. **An AI amendment is not approved when generated** — persisted as
   `ContractStatus.PENDING_APPROVAL`; becomes `APPROVED` only through the manager's
   `POST /api/tasks/{id}/approve`.
3. **Task acceptance semantics:** only managers accept; only from `DONE`; `ACCEPTED` is
   terminal; the accepting manager must also be the task **creator** (`canEditTask`).
4. **Employee status writes** are restricted to their own tasks and cannot set ACCEPTED;
   subtask-driven parents reject employee status writes.
5. **Parent reassignment cascades** to all live subtasks ("option one") and must pass
   branch+department validation; reassignment alone does not reset subtask statuses.
6. **FREE visibility:** FREE tasks/subtasks are claimable/visible only by employees of the
   task's **same branch AND department** (managers exempt; department-less tasks stay open).
7. **Subtask assignees must belong to the task's branch+department** — enforced at creation,
   on add, and on update.
8. **Partial leave must not free a task** while another employee still holds non-DONE subtasks.
9. **Claiming preserves progress** — no status/progress resets on claim or reassignment.
10. **Parent dueDate ≥ every subtask dueDate** (Arabic validation message).
11. **Parent status is derived from subtasks** whenever subtasks exist; content edits reset
    PENDING (unless ACCEPTED).
12. **Only the task creator edits/deletes** their task (even an owner cannot edit someone
    else's task — tested in `Phase2AuthorizationTest`).
13. **Branch managers** operate inside their own branch; **department managers** inside their
    managed departments; employees cannot assign tasks or manage others.
14. **Companies soft-delete** (`deleted_at`); users/branches/departments/tasks/comments delete
    hard via API.
15. **Company branch is immutable after creation** (PUT rejects branch change).
16. **Notifications must reuse `NotificationService`** — single notification system
    (implementation-derived convention; see §16).
17. **New DB migrations must be registered in `DatabaseInitializer`** — nothing auto-discovers
    `db/migration/*.sql`.

---

# 27. State Machines / Workflows

## Task lifecycle
```
PENDING → IN_PROGRESS → DONE → ACCEPTED(terminal)
   ▲        ▲            │
   └────────┴────────────┴── manager "return" (تعديل المهمة) / content edit reset
```

## Subtask lifecycle
```
PENDING → IN_PROGRESS → DONE     (start/complete by assignee only)
   ▲         │
   └── reset on content/assignee edit; reopened (DONE→IN_PROGRESS) on task return
```

## Amendment review workflow
```
Employee drafts amendment (AI) ──► POST /contracts/amendments/generate
        Contract(UPDATING, PENDING_APPROVAL, task_id)
Employee finishes task ──► Task DONE ──► manager notified
Manager opens /review/:taskId ──►  ┌─ قبول المهمة: task ACCEPTED + contract APPROVED
                                    └─ تعديل المهمة: task IN_PROGRESS, subtasks reopened,
                                       contract stays PENDING_APPROVAL (employee can redo)
```

## Authentication flow
```
Login POST /auth/login ──► JWT + TokenCache store ──► localStorage authToken + user(profile)
Any request: axios Bearer header ──► controller: requireAuthenticatedUser (JWT+cache) or JWT-only
401 ──► axios interceptor wipes localStorage ──► redirect "/"
ProtectedRoute: GET /auth/verify on every guarded route mount
```

## FREE task flow
```
Employee POST /tasks/{id}/leave
   ├─ others remain  → subtasks of leaver freed, task stays assigned, workers notified
   └─ none remain    → task FREE → notify creator + same branch+dept employees
Same branch+dept employee: sees it (list query) → POST /tasks/{id}/claim (scope-checked lock)
```

## AI generation flow — see §4/§18 diagrams.

---

# 28. End-to-End User Scenarios

**Scenario 1 — Manager creates a task (with subtasks).**
`EmployeeTasksPage` "اضافة مهمة جديدة" → pick branch → departments load → pick department →
employees load (`GET /users?branchId&departmentId`) → add subtasks (`SubtaskFormModal`,
gated on branch+dept) → `POST /api/tasks` → `validateTaskAssignment` per assignee →
`tasks`/`sub_tasks` rows → TASK_ASSIGNED notifications → activity log.

**Scenario 2 — Employee starts and completes a task.**
`/EmployeeTasks` kanban (`GET /api/tasks`, employee-scoped) → start/complete subtask buttons →
`POST .../start|complete` → parent syncs IN_PROGRESS→DONE → creator gets TASK_COMPLETED
"بانتظار مراجعتك".

**Scenario 3 — Manager reviews a completed (amendment) task.**
`/AssignedTasks` yellow queue (status DONE) → `TaskDetailsModel` shows **عرض المهمة** →
`/review/:taskId` (`GET /tasks/{id}/review`) → accordions show amendment data/PDF + original
contract with قبل/بعد toggle → **قبول المهمة** (`POST /tasks/{id}/approve`: existing accept
flow + contract APPROVED + notifications) or **تعديل المهمة** (`POST /tasks/{id}/return`).

**Scenario 4 — Multi-employee task.**
Subtasks for Ahmed & Mohamed → Ahmed leaves (`POST /tasks/{id}/leave`) → Ahmed's subtasks
unassigned, Mohamed keeps his, task not free; Mohamed still sees it; Ahmed's freed subtasks
are claimable only within the same branch+dept.

**Scenario 5 — Employee creates an AI amendment.**
`/companies2/:id/updating/new` → pick article from original contract → type instruction →
Ollama streaming (`qwen-local`) renders the modified clause → `FinalContractReview` → save →
`POST /api/contracts/amendments/generate` → PDF in `EditingContracts/`, Contract row
`PENDING_APPROVAL` (linked to `?taskId` when present) → appears in `/updating` list and in the
review page once the task is DONE.

**Scenario 6 — Company onboarding with OCR (old module).**
`ContractBrowser` → AddCompanyModal → upload PDF → `POST /api/ocr/extract` (external OCR
service) → review structured data, assign branch+department →
`POST /api/companies/with-contract` → company + folders + `CreationContract/original.pdf` +
`ocrData.json` + CREATING contract row.

**Scenario 7 — Employee attendance.**
`/profile/:id` (own) → start/end buttons with geolocation → `POST /api/attendance/start|end` →
`attendances` row (unique per user+day) → managers monitor at `/attendance`.

---

# 29. Code-Level Change Guide

| If modifying… | Frontend | API fn | Backend controller | Service | Entity / repo |
|---|---|---|---|---|---|
| Task creation/status | `features/tasks/pages/EmployeeTasksPage.jsx`, `AssignedTasksDashboard.jsx` | `api/tasks.js` | `controllers/TaskController.java` | `services/TaskService.java` | `entities/Task.java`, `repositories/TaskRepository.java` |
| Subtasks | `features/tasks/components/SubtaskFormModal.jsx` + task form in `EmployeeTasksPage` | `api/tasks.js` | `TaskController` subtask endpoints | `TaskService.addSubTask/updateSubTask/syncSubTasks/buildSubTask/validateSubTaskScope` | `entities/SubTask.java` |
| Manager review page | `features/tasks/pages/ReviewTaskPage.jsx`, `TaskDetailsModel.jsx` (عرض المهمة) | `api/tasks.js` review fns | `TaskController` `/review`, `/approve`, `/return` | `services/TaskReviewService.java` | `entities/Contract.java` |
| Contract creation/upload | `features/companies/components/UploadModal.jsx` (old), `api/contracts.js` | `api/contracts.js` | `controllers/ContractController.java` | — | `entities/Contract.java`, `ContractRepository` |
| AI amendment generation | `features/companies2/components/CreateUpdatingContractPage.jsx` (new) or `features/companies/components/createAmendmentAi/*` (old) | `api/ollamaClient.js`, `api/contracts.js generateAmendmentContract` | `ContractController.generateAndSaveAmendmentContract` | `PdfService` (render) | `ContractRepository` |
| AI prompts/models | `api/ollamaClient.js` + `createAmendmentAi/amendmentUtils.js` | — | (none — frontend-only) | — | — |
| PDF rendering | — | — | `PdfController` (bytes) | `services/PdfService.java`, `resources/templates/pdf-template.html`, `resources/fonts/` | — |
| File storage/serving | `api/files.js` | — | `controllers/FilesController.java` | `services/FileService.java` (`../FileSystem` root) | — |
| Notifications | `shared/layout/TopBar.jsx` | `api/notification.js` | `controllers/NotificationController.java` | `services/NotificationService.java` | `entities/Notification.java` |
| Branch/department filtering | `EmployeeTasksPage.jsx` (`handleBranchChange/handleDepartmentChange`) | `api/users.js fetchUsers` | `UserController.getAllUsers` | `AuthorizationService.validateTaskAssignment/getUserBranchId/getUserDepartmentId` | `EmployeeAssignment`, `EmployeeAssignmentRepository` |
| FREE logic | `EmployeeTasksPage.isTaskVisibleToUser` | — | `TaskController` claim/leave | `TaskService.claimFreeTask/claimFreeSubTask/leaveTask/notifyTaskBecameFree` | `TaskRepository.findVisibleToAssignee` |
| Auth | `features/login/LoginPage.jsx`, `components/ProtectedRoute.jsx`, `api/client.js` | `api/auth.js` | `controllers/AuthController.java` | `services/AuthService.java`, `security/JwtService.java`, `services/TokenCacheService.java` | `User`, `Role` |
| Employee management | `features/employees/pages/EmployeeManagementPage.jsx` | `api/users.js` | `controllers/UserController.java` | `AuthorizationService.canManageUser` | `User`, `EmployeeAssignment` |
| Companies | `features/companies2/components/*` (new), `features/companies/*` (old) | `api/companies.js` | `controllers/CompanyController.java` | `AuthorizationService.can*Company` | `Company` |
| OCR | `features/companies/components/AddCompanyModal.jsx` | `api/companies.js` | `controllers/OcrController.java` | `services/OcrService.java` (URL/timeout), `AssemblyService.java` (merge) | `ContractDocument` (POJO) |
| DB schema | — | — | — | — | `resources/db/migration/V*.sql` **+ register in `config/DatabaseInitializer.java`** |
| Routes (FE) | `src/App.jsx` | — | — | — | — |

---

# 30. "DO NOT BREAK THESE" — Critical Existing Behavior

1. **Original contract immutability** — CREATING contracts/files are never edited; amendments
   are separate rows. (Implemented by omission; tests don't cover it.)
2. **TaskStatus semantics** — `PENDING/IN_PROGRESS/DONE/ACCEPTED` exactly as in §12; ACCEPTED
   is terminal; manager+DONE-only acceptance; **do not add statuses** (e.g. do not add FREE to
   `TaskStatus` — FREE is a computed flag on `TaskResponse`).
3. **Single notification system** — reuse `NotificationService`; don't add a second mechanism.
4. **Multi-employee behavior** — partial leave keeps remaining employees' subtasks; parent
   stays active; full leave frees the task (scoped).
5. **Subtask assignment validation** — branch+dept enforced at create/add/update
   (`validateTaskAssignment`, `validateSubTaskScope`); frontend gating exists but must not be
   the only line of defense.
6. **FREE visibility scoping** — `findVisibleToAssignee` free-clause + `assertFreeTaskScope` +
   scoped broadcast notifications; department-less tasks keep open visibility (legacy).
7. **Branch/department filtering** — the working chain (§14) drives task form + subtask modal;
   backend role-scoped `/users` must keep filtering owners out for non-owner callers.
8. **Cascade reassignment ("option one")** — parent reassignment reassigns all live subtasks.
9. **Amendment review lifecycle** — generate → PENDING_APPROVAL → review (approve/return);
   approve reuses the existing accept flow; the original contract is untouched.
10. **Single-session token cache** — replacing `TokenCacheService` semantics changes logout/
    multi-tab behavior app-wide.
11. **`DatabaseInitializer` hardcoded migration list** — new SQL files do nothing until
    registered there (this already caused a production error once — `contracts.task_id`).
12. **Existing API contracts** — `TaskResponse.free/workingEmployees/subtasks` shapes are
    consumed by several pages; `buildUserMap`'s keys drive the whole UI session object.
13. **The blob+iframe PDF viewer pattern** — reuse it for new PDF views instead of react-pdf
    (whose integration is unfinished).
14. **Upload path conventions** — `{companyId} - {companyName}/...` and hardcoded
    `creatingContract.pdf` / `ocrData.json` filenames in `fetchCompanyCreating`.

---

# 31. Known Issues / Technical Debt

**Confirmed (verified in code/tests):**

1. `Phase2AuthorizationTest.testValidateTaskAssignment_DepartmentManagerScope` fails
   (expected 403, got 400) — employee-dept mismatch check fires before the DM scope check in
   `validateTaskAssignment`. Pre-existing (verified on the pristine tree).
2. `features/companies/components/PdfPage.jsx` — react-pdf `<Document>` JSX commented out;
   the routed amendment-PDF page literally renders "unfinshed (hard coded message)".
3. `AddCompanyModal.jsx` (old companies) uses `useMemo` without importing it → the add-company
   wizard crashes when opened.
4. `FilesController.uploadToCompanyFolder` calls `Files.copy` twice on one consumed stream →
   saved files are **0 bytes**.
5. `components/index.js` barrel exports non-existent modules (`./AppShell`, `./Sidebar`,
   `./TopBar`); `shared/hooks` barrel exports non-existent `useMockAsyncData`. Both barrels are
   themselves unimported.
6. `features/companiesManagment/` — orphaned 1471-line earlier draft with a broken import
   (`shared/data/mockData` doesn't exist).
7. `AI/score.py` is an **HTML file** mis-named `.py` (zero Python constructs).
8. `docker-compose.yml` sets `VITE_API_BASE_URL` but `api/client.js` reads `VITE_API_URL` → in
   Docker the frontend falls back to `http://localhost:8080/api`.
9. `application.properties` declares multipart limits twice (20MB wins) — 50MB uploads can fail.
10. `config/JacksonConfig` replaces Boot's `ObjectMapper` with a bare instance → dates
    serialize as arrays; frontend carries workarounds (`dateValueToMs`).
11. `spring.sql.init.mode=never` → `db/migrate-subtasks.sql` is dead config (applied manually).
12. `Task.status`/`SubTask.status` use PG enum-ish columns defined as varchar(50) — mixed
    styles across entities (some `@Enumerated(STRING)`, some columnDefinition).
13. `CompanyController.getAllContracts` injected into `CompanyController` to populate the
    `@Transient contracts` field (layering smell; N+1-ish payload).
14. `CreateUpdatingContractPage` loads the original contract from a **hardcoded local mock**
    (`getCreatingContractByCompanyId` constant) although the real API function exists.
15. Dead code: `features/ledger/`, `api/{ledger,reporting,permissions,permissionRoles,
    userRoles,taskApprovals,contractApprovals,employeeAssignments}.js`, `components/NavBar.jsx`,
    `ResponsiveTable`, `components/StatusBadge`, `StatCard`, `PrimaryButton`, `useAsyncData`,
    `SlideOver`/`BudgetBar`, `DeleteToast`, `sampleArticles.mockArticles`, `shared/data`
    mocks, i18n locales (no `t()` calls), `bcrypt` npm dep in the frontend.
16. Dashboard "عرض الكل" (contracts) links to `/ContractAi` — route doesn't exist.
17. LoginPage "remember me" and "forgot password" are decorative.
18. `TaskReviewService` return path maps DONE→IN_PROGRESS; if the frontend reopened a returned
    task elsewhere, statuses stay consistent — but there is **no dedicated "returned" state**;
    an employee cannot distinguish "returned" from "in progress" (inferred limitation).
19. `TopBar` has no navigation handler for `TASK_COMPLETED` notifications.
20. Legacy duplication: two companies modules, two AI-amendment UIs, two DTO packages
    (`dto/` + `dtos/`), `controllers/` + `controller/` packages, `AddCompanyModal` vs
    `AddCompanyModel` naming.
21. `AttendanceController` role checks use raw names (`owner`, `headbranch`, `employee`,
    `headdepartment`) — mismatch risk with seeded role names. Requires verification.
22. `GET /tasks` used to return everything to everyone; it is now role-scoped for employees
    (this documentation's project change) — managers still receive all tasks.
23. `updateContract`/`deleteContract`/`POST /contracts` accept raw entities with no role checks.

**Suspected (not fully verified):**
- Performance: `DashboardPage` fires 7 full-list requests; `GET /contracts` returns full
  entities including TEXT `ocr_data` (documented as a gap in `docs/dashboard-summary-endpoint.md`).
- `EmployeeTasksPage` legacy "assignee rank" visibility may leak tasks to lower-rank users
  client-side; backend `GET /tasks` now scopes employees, so this is belt-and-braces.
- `fetchCompanyCreating` fails for companies whose folder names deviate from
  `{id} - {name}` (e.g. renamed companies).

---

# 32. Testing

- **Framework:** JUnit 5, `@SpringBootTest` — **integration tests against the live Neon DB**
  (no mocks, no test DB, no testcontainers). Each run creates fixture rows (users `test_*`,
  `tfr_*`; tasks are cleaned up by `TaskFlowRegressionTest`).
- **Location:** `Backend/src/test/java/com/accounting/backend/`.
- **Suites:**
  - `BackendApplicationTests` — context loads (1).
  - `Phase1AuthorizationTest` (19) — role hierarchy, branch/dept consistency, activity visibility.
  - `Phase2AuthorizationTest` (20) — company/task scoping, creator-only edit, owner-assign
    rules. **1 known pre-existing failure** (§31.1).
  - `TaskFlowRegressionTest` (13) — task/subtask lifecycle, notifications, FREE scoping,
    claim scope, subtask dept validation, review lifecycle (approve/return), employee blocked
    from review.
- **Not covered:** controllers/HTTP layer, contracts module, OCR/PDF, notifications content,
  auth endpoints, frontend (no test script at all).
- **Commands:** backend `cd Backend && ./mvnw test` (~12 min; full suite) or
  `./mvnw test -Dtest=TaskFlowRegressionTest` (~6 min); frontend `npm run build`, `npm run lint`.

---

# 33. Running the Project

**Prerequisites:** Java 21+ (runtime 25/26 observed), Maven via `mvnw`, Node 20+, a reachable
PostgreSQL with the expected schema (repo is wired to a Neon cloud DB — credentials are
committed; ideally switch to a local DB by editing `spring.datasource.*`), Ollama running with
models `qwen-local` + `qwen3-embedding:0.6b` (only needed for AI features), the OCR service URL
(`ocr.api.url`) must point at a live tunnel (only needed for OCR).

**Backend:** `cd Backend && ./mvnw spring-boot:run` → http://localhost:8080 .
On boot, `DatabaseInitializer` runs V1–V3 idempotently (logs "executed successfully").

**Frontend:** `cd Frontend && npm install && npm run dev` → Vite dev server (default port 5173;
check console). `VITE_API_URL` in `.env` must point at the backend. Build: `npm run build`.

**Docker:** `docker compose up` — backend on 8080, frontend served (`serve -s dist`) on 3000.
⚠ the compose `VITE_API_BASE_URL` variable is not read by the code (§31.8); both containers
talk to the same committed Neon DB.

**Database:** no local DB provisioning exists in the repo; schema comes from migrations
V1–V3 + the (manually applied) `db/migrate-subtasks.sql` + pre-existing tables.

---

# 34. Deployment / Infrastructure

- `Backend/Dockerfile`: multi-stage `eclipse-temurin:25-jdk-alpine` build → `25-jre-alpine`
  runtime, non-root `appuser`, EXPOSE 8080, healthcheck `java -version` (weak healthcheck).
- `Frontend/Dockerfile`: `node:20-alpine` build (`npm ci`, `npm run build`) → `serve -s dist -l 3000`.
- `docker-compose.yml`: services `backend` (8080) and `frontend` (3000) on
  `accounting-network`; backend env overrides datasource (same Neon DB); frontend
  `depends_on` backend. **No DB service** — the database is the external Neon instance.
- `SPRING_PROFILES_ACTIVE=docker` has no matching properties file (defaults apply).
- No CI/CD, no k8s/terraform, no deploy scripts found in the repo.

---

# 35. Glossary

| Term | Meaning |
|---|---|
| **عقد التأسيس / Incorporation Contract / CREATING** | original, immutable founding contract of a company (`ContractType.CREATING`) |
| **عقد التعديل / Amendment / UPDATING** | AI-drafted amendment contract (`ContractType.UPDATING`), `PENDING_APPROVAL` until accepted |
| **Task** | work item (`tasks`), `TaskStatus`: PENDING / IN_PROGRESS / DONE / ACCEPTED |
| **SubTask** | child work item (`sub_tasks`), `SubTaskStatus`: PENDING / IN_PROGRESS / DONE |
| **FREE** | computed availability state: parent unassigned AND no active assigned subtasks (`TaskResponse.free`) |
| **Claim / استلام** | taking a FREE task/subtask (`/claim` endpoints) |
| **Leave** | releasing assignment (`/leave`); may trigger FREE |
| **Review** | manager lifecycle for DONE tasks (`/review/:taskId`, قبول المهمة = approve, تعديل المهمة = return) |
| **Branch (فرع)** | org unit (`branches`); departments belong to branches |
| **Department (قسم)** | org unit (`departments`); users belong via `EmployeeAssignment` (primary row wins) |
| **Managed departments** | `department_manager_departments` rows granting a DEPARTMENT_MANAGER multiple departments |
| **canonical role** | `SystemRole`: OWNER / BRANCH_MANAGER (`headBranch`) / DEPARTMENT_MANAGER (`headDepartment`) / EMPLOYEE |
| **ocrData** | JSON stored on `Contract`: OCR `ContractDocument` (CREATING) or amendment `PdfRequest` (UPDATING) |
| **Article (مادة)** | clause inside a contract (`articles: [{id, value}]`) |
| **قبل/بعد التعديل** | before/after toggle for amended articles (ReviewTaskPage) |
| **companies (old) / companies2 (new)** | the two live company modules (OCR browser vs contract workflows) |
| **CLARA** | frontend app brand (sidebar/index.html) |
| **DatabaseInitializer** | boot runner executing hardcoded migration scripts V1–V3 |
| **TokenCacheService** | in-memory single-session JWT store |

---

# 36. Quick Reference for AI Coding Agents

**What:** Arabic RTL office-management SPA (React 19/Vite) + Spring Boot 4 REST API (port 8080)
+ Neon PostgreSQL (schema via manual migrations) + filesystem document store (`../FileSystem`).
LLM features run **in the browser** against a local Ollama; OCR runs in the backend against an
external HTTP service.

**First files to inspect before touching anything:**

- **Session/auth:** `Frontend/src/api/client.js`, `features/login/LoginPage.jsx`,
  `components/ProtectedRoute.jsx`, `Backend/.../services/AuthService.java`,
  `security/JwtService.java`, `services/TokenCacheService.java`.
- **Roles/scope:** `Backend/.../services/AuthorizationService.java` (all can* + 
  `validateTaskAssignment`), `Frontend/src/utils/roles.js`.
- **Tasks:** `Backend/.../services/TaskService.java` (900 lines — read fully before editing),
  `controllers/TaskController.java`, `repositories/TaskRepository.java` (`findVisibleToAssignee`),
  `Frontend/src/features/tasks/pages/EmployeeTasksPage.jsx` (1400 lines), `TaskDetailsModel.jsx`.
- **Review flow:** `services/TaskReviewService.java`, `Frontend/src/features/tasks/pages/ReviewTaskPage.jsx`.
- **Contracts/amendments:** `controllers/ContractController.java`
  (`/contracts/amendments/generate` is the persistence point), `entities/Contract.java`,
  `Frontend/src/features/companies2/components/CreateUpdatingContractPage.jsx`.
- **AI:** `Frontend/src/api/ollamaClient.js`,
  `features/companies/components/createAmendmentAi/{ArticleSection.jsx, amendmentUtils.js,
  useCreateAmendmentAiForm.js, amendmentPdfUtils.js}`.
- **PDF:** `services/PdfService.java`, `resources/templates/pdf-template.html`,
  `controllers/PdfController.java`, `controllers/FilesController.java`, `services/FileService.java`.
- **Notifications:** `services/NotificationService.java`, `shared/layout/TopBar.jsx` — reuse, don't duplicate.
- **Org structure:** `entities/{Branch,Department,EmployeeAssignment}.java`,
  `controllers/{BranchController,DepartmentController,EmployeeAssignmentController,
  DepartmentManagerController}.java`.
- **DB schema changes:** create `db/migration/V4__*.sql` **and add it to
  `config/DatabaseInitializer.java`** (nothing auto-discovers migrations; `ddl-auto=none`).

**How to trace a feature end-to-end:** start from the route in `Frontend/src/App.jsx` → page
component → `api/<domain>.js` function → HTTP path → `controllers/<X>Controller.java` →
service → repository → table. Reverse direction works the same. Activity-log calls
(`activityLogService.logAction`) and notifications (`notificationService.createNotification`)
are side effects to preserve when refactoring flows.

**Absolute rules:** don't modify CREATING contracts; don't add task statuses; keep FREE as a
computed flag scoped by branch+department; keep subtask branch+dept validation on the backend;
reuse the blob+iframe PDF pattern and the single notification system; register new migrations;
never trust the frontend's role checks alone (add/keep backend authorization); don't break the
single-session token model or the `localStorage.user` profile contract.

**Known live failures to not mistake for your own bugs:** the pre-existing
`Phase2AuthorizationTest` 403/400 failure (§31.1); `PdfPage` renders "unfinshed";
old-module `AddCompanyModal` crashes on open (missing `useMemo` import).

---

*End of PROJECT_DOCUMENTATION.md — generated from repository inspection; masked values
(`spring.datasource.password`, `spring.mail.password`, `jwt.secret`, `.env` values) were
intentionally not reproduced.*


