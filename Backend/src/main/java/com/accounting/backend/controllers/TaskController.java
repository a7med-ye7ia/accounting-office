package com.accounting.backend.controllers;

import com.accounting.backend.dto.TaskRequest;
import com.accounting.backend.dto.TaskResponse;
import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.Task;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.NotificationType;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.enums.TaskStatus;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.CompanyRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.TaskRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.AuthorizationService;
import com.accounting.backend.services.NotificationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private ActivityLogService activityLogService;

    /**
     * GET /api/tasks
     * Scoped task listing according to authenticated caller's role:
     * - OWNER: all tasks
     * - BRANCH_MANAGER: tasks assigned to or created by employees in own branch
     * - DEPARTMENT_MANAGER: tasks in managed departments scope
     * - EMPLOYEE: tasks assigned to themselves
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole role = authorizationService.getUserRole(callerId);

        List<Task> tasks;
        if (role == SystemRole.OWNER) {
            tasks = taskRepository.findByDeletedAtIsNull();
        } else if (role == SystemRole.EMPLOYEE) {
            tasks = taskRepository.findByDeletedAtIsNullAndAssignedTo_Id(callerId);
        } else if (role == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            tasks = taskRepository.findByDeletedAtIsNull().stream()
                    .filter(t -> {
                        Long assignedBranch = t.getAssignedTo() != null ? authorizationService.getUserBranchId(t.getAssignedTo().getId()) : null;
                        Long creatorBranch = t.getCreatedBy() != null ? authorizationService.getUserBranchId(t.getCreatedBy().getId()) : null;
                        return (callerBranch != null && (callerBranch.equals(assignedBranch) || callerBranch.equals(creatorBranch)));
                    })
                    .toList();
        } else if (role == SystemRole.DEPARTMENT_MANAGER) {
            List<Long> managedDepts = authorizationService.getManagedDepartmentIds(callerId);
            tasks = taskRepository.findByDeletedAtIsNull().stream()
                    .filter(t -> {
                        Long assignedDept = t.getAssignedTo() != null ? authorizationService.getUserDepartmentId(t.getAssignedTo().getId()) : null;
                        return assignedDept != null && managedDepts.contains(assignedDept);
                    })
                    .toList();
        } else {
            tasks = List.of();
        }

        List<TaskResponse> responses = tasks.stream()
                .map(TaskResponse::mapToResponse)
                .toList();

        return ResponseEntity.ok(responses);
    }

    /**
     * GET /api/tasks/{id}
     * Proper REST endpoint for fetching a single task by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Task task = taskRepository.findById(id).orElse(null);
        if (task == null || task.getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }

        if (!authorizationService.canViewTask(caller.getId(), task)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بعرض بيانات هذه المهمة"));
        }

        return ResponseEntity.ok(TaskResponse.mapToResponse(task));
    }

    /**
     * Backward-compatible alias for legacy frontend route /api/tasks/tasks/{id}
     */
    @GetMapping("/tasks/{id}")
    public ResponseEntity<?> getTaskByIdLegacy(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        return getTaskById(authHeader, id);
    }

    /**
     * POST /api/tasks
     * Creates a new task.
     * Rules:
     * - Creator identity is strictly derived from authenticated JWT (never from request body).
     * - Company selection is required (task must belong to a company).
     * - Employees cannot create tasks.
     * - Owner can assign across branches.
     * - Branch Manager can assign only within own branch.
     * - Department Manager can assign only within managed departments.
     */
    @PostMapping
    public ResponseEntity<?> createTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody TaskRequest request) {

        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        // 1. Creator identity strictly from JWT
        User createdByUser = caller;

        // Block unverified creator
        if (createdByUser.getStatus() == UserStatus.PENDING_VERIFICATION) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "حسابك غير مفعل بعد. يرجى تغيير كلمة المرور المؤقتة أولاً."
            ));
        }

        // 2. Company is required
        if (request.getCompanyId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "اختيار الشركة مطلوب لإنشاء المهمة"));
        }

        Company company = companyRepository.findById(request.getCompanyId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "الشركة المحددة غير موجودة"));
        if (company.getDeletedAt() != null) {
            return ResponseEntity.badRequest().body(Map.of("error", "لا يمكن إسناد مهمة لشركة محذوفة"));
        }

        // 3. Assignee is required
        if (request.getAssignedToId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "الموظف المسند إليه مطلوب"));
        }

        User assignedUser = userRepository.findById(request.getAssignedToId()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "الموظف المسند إليه غير موجود"));

        // Block unverified assignee
        if (assignedUser.getStatus() == UserStatus.PENDING_VERIFICATION) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "المستخدم '" + assignedUser.getFullName() + "' لم يقم بتفعيل حسابه بعد."
            ));
        }

        // 4. Verify caller can assign task to target employee (scope check)
        if (!authorizationService.canAssignTask(callerId, assignedUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "غير مصرح لك بإسناد مهام لهذا الموظف بناءً على نطاق صلاحياتك"
            ));
        }

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.PENDING);
        task.setDueDate(request.getDueDate());
        task.setCreatedAt(LocalDateTime.now());
        task.setAssignedTo(assignedUser);
        task.setCreatedBy(createdByUser);
        task.setCompany(company);

        // Associate with assignee's department if available
        Long assigneeDeptId = authorizationService.getUserDepartmentId(assignedUser.getId());
        if (assigneeDeptId != null) {
            departmentRepository.findById(assigneeDeptId).ifPresent(task::setDepartment);
        }

        Task saved = taskRepository.save(task);

        String message = String.format("You have been assigned a new task: %s", task.getTitle());
        notificationService.createNotification(assignedUser.getId(), "New task",
                             message, NotificationType.TASK_ASSIGNED, saved.getId());

        Map<String, Object> meta = new HashMap<>();
        meta.put("taskTitle", saved.getTitle());
        meta.put("assignedTo", assignedUser.getFullName());
        meta.put("company", company.getName());
        activityLogService.logAction(
            createdByUser.getId(), company.getId(), EntityType.TASK, saved.getId(),
            ActionType.CREATE, "تم إنشاء مهمة: " + saved.getTitle() + " للشركة: " + company.getName(), meta);

        return ResponseEntity.ok(TaskResponse.mapToResponse(saved));
    }

    /**
     * PUT /api/tasks/{id}
     * Edits a task. ONLY the task creator can edit task details.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody TaskRequest request) {

        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        Task task = taskRepository.findById(id).orElse(null);
        if (task == null || task.getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }

        // ONLY the task creator can edit the task
        if (!authorizationService.canEditTask(callerId, task)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط منشئ المهمة يمكنه تعديل بياناتها"));
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            task.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }

        // Reassignment: if changing assignee, verify scope
        if (request.getAssignedToId() != null && !request.getAssignedToId().equals(task.getAssignedTo().getId())) {
            User newAssignee = userRepository.findById(request.getAssignedToId()).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "الموظف الجديد غير موجود"));

            if (!authorizationService.canAssignTask(callerId, newAssignee.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "غير مصرح لك بإسناد المهمة لهذا الموظف"));
            }
            task.setAssignedTo(newAssignee);
        }

        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }

        // Creator and Company are immutable on task update!
        // task.setCreatedBy() is deliberately NOT called here to prevent creator hijacking.

        Task updated = taskRepository.save(task);

        Map<String, Object> meta = new HashMap<>();
        meta.put("taskTitle", updated.getTitle());
        activityLogService.logAction(
            callerId, task.getCompany() != null ? task.getCompany().getId() : null, EntityType.TASK, updated.getId(),
            ActionType.UPDATE, "تم تحديث المهمة: " + updated.getTitle(), meta);

        return ResponseEntity.ok(TaskResponse.mapToResponse(updated));
    }

    /**
     * PATCH /api/tasks/{id}/status (and PUT /api/tasks/{id}/status)
     * Changes task status. ONLY the assigned employee can change status.
     */
    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<?> updateTaskStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        Task task = taskRepository.findById(id).orElse(null);
        if (task == null || task.getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }

        // ONLY the assigned employee can change status
        if (!authorizationService.canChangeTaskStatus(callerId, task)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط الموظف المسند إليه المهمة يمكنه تغيير حالتها"));
        }

        if (!body.containsKey("status") || body.get("status") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "حالة المهمة مطلوبة"));
        }

        TaskStatus newStatus;
        try {
            newStatus = TaskStatus.valueOf(body.get("status").toString().trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "حالة المهمة غير صالحة"));
        }

        task.setStatus(newStatus);
        Task updated = taskRepository.save(task);

        Map<String, Object> meta = new HashMap<>();
        meta.put("taskTitle", updated.getTitle());
        meta.put("newStatus", newStatus.name());
        activityLogService.logAction(
            callerId, task.getCompany() != null ? task.getCompany().getId() : null, EntityType.TASK, updated.getId(),
            ActionType.UPDATE, "تم تغيير حالة المهمة إلى: " + newStatus.name(), meta);

        return ResponseEntity.ok(TaskResponse.mapToResponse(updated));
    }

    /**
     * DELETE /api/tasks/{id}
     * Deletes a task. ONLY the task creator can delete the task.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {

        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        Task task = taskRepository.findById(id).orElse(null);
        if (task == null || task.getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }

        // ONLY the task creator can delete the task
        if (!authorizationService.canDeleteTask(callerId, task)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط منشئ المهمة يمكنه حذفها"));
        }

        String taskTitle = task.getTitle();
        Long companyId = task.getCompany() != null ? task.getCompany().getId() : null;

        // Soft-delete to preserve comment and approval relationships
        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);

        Map<String, Object> meta = new HashMap<>();
        meta.put("taskTitle", taskTitle);
        activityLogService.logAction(
            callerId, companyId, EntityType.TASK, id,
            ActionType.DELETE, "تم حذف المهمة: " + taskTitle, meta);

        return ResponseEntity.ok().build();
    }

    @GetMapping("/assignedTo/{userId}")
    public ResponseEntity<?> getTasksByUserId(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long userId) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.canViewUser(caller.getId(), userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بعرض مهام هذا المستخدم"));
        }

        List<TaskResponse> responses = taskRepository.findByDeletedAtIsNullAndAssignedTo_Id(userId)
            .stream()
            .map(TaskResponse::mapToResponse)
            .toList();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/createdBy/{userId}")
    public ResponseEntity<?> getTasksByCreatedByUserId(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long userId) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.canViewUser(caller.getId(), userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بعرض مهام هذا المستخدم"));
        }

        List<TaskResponse> responses = taskRepository.findByDeletedAtIsNullAndCreatedBy_Id(userId)
            .stream()
            .map(TaskResponse::mapToResponse)
            .toList();

        return ResponseEntity.ok(responses);
    }
}