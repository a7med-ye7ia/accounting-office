# Dashboard summary API (recommended)

Optional dedicated endpoint: **`GET /api/dashboard/summary`**

Use when you want a **single round-trip**, smaller payloads, and server-side filtering (soft-deletes, aggregates).

## JSON response shape

```json
{
  "generatedAt": "2026-05-13T14:30:00",
  "counts": {
    "usersTotal": 120,
    "usersActive": 108,
    "usersWithoutDepartment": 4,
    "departments": 14,
    "branches": 5,
    "roles": 8,
    "companiesTotal": 42,
    "companiesActive": 40,
    "tasksTotal": 310,
    "tasksOpen": 45,
    "tasksOverdue": 7,
    "contractsTotal": 88,
    "contractsPendingApproval": 6
  },
  "tasksByStatus": {
    "PENDING": 20,
    "IN_PROGRESS": 25,
    "DONE": 265
  },
  "contractsByStatus": {
    "DRAFT": 10,
    "PENDING_APPROVAL": 6,
    "APPROVED": 60,
    "REJECTED": 12
  },
  "recentTasks": [
    {
      "id": 1,
      "title": "مراجعة عقد",
      "status": "IN_PROGRESS",
      "dueDate": "2026-05-20T17:00:00",
      "createdAt": "2026-05-10T09:00:00",
      "departmentId": 3,
      "departmentName": "المحاسبة",
      "assignedToId": 12,
      "assignedToName": "أحمد علي"
    }
  ],
  "recentContracts": [
    {
      "id": 9,
      "type": "ESTABLISHMENT",
      "status": "PENDING_APPROVAL",
      "createdAt": "2026-05-11T11:15:00",
      "companyId": 4,
      "companyName": "شركة النقل",
      "createdById": 2,
      "createdByName": "مسؤول النظام"
    }
  ]
}
```

- **`recentTasks` / `recentContracts`**: cap at **5–10** rows, ordered by `createdAt` descending.
- Omit or null nested fields if you prefer slimmer DTOs; the frontend can stay defensive.

## Java DTO sketch

- `DashboardSummaryResponse` with nested `Counts`, maps for status breakdowns, and `List<RecentTaskRow>`, `List<RecentContractRow>`.

## DB / query notes

- Respect **`deleted_at`** (users, companies, contracts, tasks) consistently in aggregates.
- For **users without department**, join primary `employee_assignments` or use your canonical rule (same as `UserController.buildUserMap`).

---

## Frontend gaps discovered (current `Promise.all` implementation)

These limit polish until you extend APIs or add `/api/dashboard/summary`:

| Gap | Detail |
|-----|--------|
| **`TaskResponse` has no `createdAt`** | «آخر المهام» sorted by **`id` descending** as a proxy for recency. Prefer exposing **`createdAt`** on task list DTOs. |
| **`TaskResponse` has no `departmentId` / `departmentName`** | Cannot show department in the tasks table without widening the DTO or a join endpoint. |
| **`TaskResponse` has no `deletedAt`** | Cannot hide soft-deleted tasks on the client; relies on backend list filtering. |
| **`GET /api/users` list** | `buildUserMap` does not expose **`deletedAt`**; deleted users may still inflate counts if the repository returns them. |
| **`GET /api/contracts`** | Returns full **`Contract`** entities; nested **`company`** / **`createdBy`** depend on fetch graph and Jackson config (risk of lazy-init or huge payloads). A slim **contract row DTO** is safer for dashboard lists. |
| **Contract `GET` path** | Frontend uses `/contracts` and `/contracts/{id}`; ensure list responses include at least **`id`, `type`, `status`, `createdAt`, `deletedAt`, `company.name`**. |
| **Companies** | Frontend assumes **`status`** and **`deletedAt`** on company JSON (aligned with `Company` entity). |
