package com.accounting.backend.services;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.accounting.backend.dto.SubTaskRequest;
import com.accounting.backend.dto.TaskRequest;
import com.accounting.backend.dto.TaskResponse;
import com.accounting.backend.entities.Department;
import com.accounting.backend.entities.SubTask;
import com.accounting.backend.entities.Task;
import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.enums.NotificationType;
import com.accounting.backend.enums.SubTaskStatus;
import com.accounting.backend.enums.TaskStatus;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.SubTaskRepository;
import com.accounting.backend.repositories.TaskApprovalRepository;
import com.accounting.backend.repositories.TaskRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;

@Service
public class TaskService {

    private static final Set<String> MANAGER_ROLES = Set.of("owner", "manager", "headbranch", "headdepartment");

    @Autowired
    private TaskRepository taskRepository;
    @Autowired
    private TaskApprovalRepository taskApprovalRepository;
    @Autowired
    private SubTaskRepository subTaskRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private UserRoleRepository userRoleRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private AuthorizationService authorizationService;
    @Autowired
    private com.accounting.backend.repositories.EmployeeAssignmentRepository employeeAssignmentRepository;
    @Autowired
    private com.accounting.backend.repositories.CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<TaskResponse> getAllTasks(Long callerId) {
        if (callerId == null || isManager(callerId)) {
            return taskRepository.findAll().stream().map(TaskResponse::mapToResponse).toList();
        }
        // Employees only see their own work plus free tasks in their branch+department scope
        return taskRepository.findVisibleToAssignee(callerId).stream()
                .map(TaskResponse::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        return TaskResponse.mapToResponse(requireTask(id));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByAssignee(Long userId) {
        return taskRepository.findVisibleToAssignee(userId).stream()
                .map(TaskResponse::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByCreator(Long userId) {
        return taskRepository.findByCreatedBy_Id(userId).stream()
                .map(TaskResponse::mapToResponse)
                .toList();
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        return createTask(request, request.getCreatedById());
    }

    @Transactional
    public TaskResponse createTask(TaskRequest request, Long callerId) {
        validateParentCreate(request);

        Long parentAssigneeId = resolveParentAssigneeId(request);
        User assignedUser = requireAssignableUser(parentAssigneeId);
        Long effectiveCallerId = callerId != null ? callerId : request.getCreatedById();
        User createdByUser = requireUser(effectiveCallerId, "Creator user not found");
        rejectUnverified(createdByUser,
                "Your account is not yet verified. Please change your temporary password first.");

        // Validate Task Assignment (Branch -> Department -> Employee + Role Scoping)
        authorizationService.validateTaskAssignment(effectiveCallerId, request.getBranchId(), request.getDepartmentId(), assignedUser.getId());

        // Validate subtasks assignees if present
        if (request.getSubtasks() != null) {
            for (SubTaskRequest subRequest : request.getSubtasks()) {
                Long subAssigneeId = subRequest.getAssignedToId() != null ? subRequest.getAssignedToId() : assignedUser.getId();
                authorizationService.validateTaskAssignment(effectiveCallerId, request.getBranchId(), request.getDepartmentId(), subAssigneeId);
            }
        }

        LocalDateTime parentDueDate = resolveParentDueDate(request);

        Task task = new Task();
        task.setTitle(request.getTitle().trim());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus() != null ? request.getStatus() : TaskStatus.PENDING);
        task.setDueDate(parentDueDate);
        task.setCreatedAt(LocalDateTime.now());
        task.setAssignedTo(assignedUser);
        task.setCreatedBy(createdByUser);

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            task.setDepartment(dept);
        }

        if (request.getCompanyId() != null) {
            companyRepository.findById(request.getCompanyId()).ifPresent(task::setCompany);
        }

        if (request.getSubtasks() != null) {
            for (SubTaskRequest subRequest : request.getSubtasks()) {
                SubTask subTask = buildSubTask(task, subRequest, assignedUser);
                task.getSubTasks().add(subTask);
            }
        }

        Task saved = taskRepository.save(task);
        notificationService.createNotification(
                assignedUser.getId(),
                "New task",
                String.format("You have been assigned a new task: %s", saved.getTitle()),
                NotificationType.TASK_ASSIGNED,
                saved.getId());
        notifyDistinctSubtaskAssignees(saved, assignedUser.getId());
        return TaskResponse.mapToResponse(saved);
    }

    @Transactional
    public TaskResponse updateTask(Long id, TaskRequest request, Long callerId) {
        Task task = requireTask(id);
        User caller = callerId != null ? requireUser(callerId, "Caller user not found") : null;
        boolean manager = caller != null && isManager(caller.getId());
        boolean employeeOnly = caller != null && !manager;

        if (employeeOnly) {
            applyEmployeeStatusUpdate(task, request, caller);
            Task updated = taskRepository.save(task);
            return TaskResponse.mapToResponse(updated);
        }

        if (callerId != null && !authorizationService.canEditTask(callerId, task)) {
            throw new SecurityException("فقط منشئ المهمة يمكنه تعديلها");
        }

        if (request.getAssignedToId() != null || request.getBranchId() != null || request.getDepartmentId() != null) {
            Long targetAssigneeId = request.getAssignedToId() != null ? request.getAssignedToId() : (task.getAssignedTo() != null ? task.getAssignedTo().getId() : null);
            Long targetBranchId = request.getBranchId();
            Long targetDeptId = request.getDepartmentId() != null ? request.getDepartmentId() : (task.getDepartment() != null ? task.getDepartment().getId() : null);
            if (targetBranchId == null && targetDeptId != null) {
                Department d = departmentRepository.findById(targetDeptId).orElse(null);
                if (d != null && d.getBranch() != null) targetBranchId = d.getBranch().getId();
            }
            if (targetAssigneeId != null) {
                authorizationService.validateTaskAssignment(callerId, targetBranchId, targetDeptId, targetAssigneeId);
            }
        }

        String previousTitle = task.getTitle();
        String previousDescription = task.getDescription();
        TaskStatus previousStatus = task.getStatus();

        if (request.getTitle() != null) {
            if (request.getTitle().isBlank()) {
                throw new IllegalArgumentException("title is required");
            }
            task.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        if (request.getCreatedById() != null) {
            task.setCreatedBy(requireUser(request.getCreatedById(), "Creator user not found"));
        }
        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
            task.setDepartment(dept);
        }
        if (request.getCompanyId() != null) {
            companyRepository.findById(request.getCompanyId()).ifPresent(task::setCompany);
        }

        boolean taskContentChanged = !Objects.equals(previousTitle, task.getTitle())
                || !Objects.equals(previousDescription, task.getDescription());

        Long previousAssigneeId = task.getAssignedTo() != null ? task.getAssignedTo().getId() : null;
        boolean assignmentChanged = false;
        if (request.getAssignedToId() != null) {
            User newAssignee = requireAssignableUser(request.getAssignedToId());
            assignmentChanged = previousAssigneeId == null || !previousAssigneeId.equals(newAssignee.getId());
            task.setAssignedTo(newAssignee);
            if (assignmentChanged) {
                cascadeParentAssignment(task, newAssignee);
            }
        }

        if (request.getSubtasks() != null) {
            syncSubTasks(task, request.getSubtasks(), assignmentChanged);
        }

        if (request.getDueDate() != null || request.getSubtasks() != null) {
            validateAndSyncParentDueDate(task, request.getDueDate());
        }

        if (request.getStatus() != null) {
            applyParentStatusChange(task, request.getStatus(), manager || caller == null);
        }

        syncParentStatus(task);

        if ((manager || caller == null) && taskContentChanged && task.getStatus() != TaskStatus.ACCEPTED) {
            task.setStatus(TaskStatus.PENDING);
            for (SubTask s : TaskResponse.liveSubTasks(task)) {
                s.setStatus(SubTaskStatus.PENDING);
            }
        }

        Task updated = taskRepository.save(task);
        if (assignmentChanged && updated.getAssignedTo() != null) {
            notificationService.createNotification(
                    updated.getAssignedTo().getId(),
                    "New task",
                    String.format("You have been assigned a new task: %s", updated.getTitle()),
                    NotificationType.TASK_ASSIGNED,
                    updated.getId());
        }

        // Employee submitted the task for manager review
        if (previousStatus != TaskStatus.DONE && updated.getStatus() == TaskStatus.DONE
                && updated.getCreatedBy() != null
                && (caller == null || !updated.getCreatedBy().getId().equals(caller.getId()))) {
            notificationService.createNotification(
                    updated.getCreatedBy().getId(),
                    "Task completed",
                    "المهمة بانتظار مراجعتك: " + updated.getTitle(),
                    NotificationType.TASK_COMPLETED,
                    updated.getId());
        }

        return TaskResponse.mapToResponse(updated);
    }

    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id).orElse(null);
        if (task == null) {
            return;
        }
        taskApprovalRepository.deleteByTask_Id(id);
        taskRepository.delete(task);
    }

    @Transactional
    public TaskResponse addSubTask(Long taskId, SubTaskRequest request, Long callerId) {
        Task task = requireTask(taskId);
        if (task.getStatus() == TaskStatus.ACCEPTED) {
            throw new IllegalStateException("Cannot add a subtask to an accepted task");
        }
        SubTask subTask = buildSubTask(task, request, task.getAssignedTo());
        validateSubTaskScope(task, subTask.getAssignedTo(), callerId);
        task.getSubTasks().add(subTask);
        syncParentStatus(task);
        Task saved = taskRepository.save(task);
        if (subTask.getAssignedTo() != null) {
            notificationService.createNotification(
                    subTask.getAssignedTo().getId(),
                    "New task",
                    String.format("You have been assigned a subtask on: %s", saved.getTitle()),
                    NotificationType.TASK_ASSIGNED,
                    saved.getId());
        }
        return TaskResponse.mapToResponse(saved);
    }

    @Transactional
    public TaskResponse updateSubTask(Long taskId, Long subTaskId, SubTaskRequest request, Long callerId) {
        Task task = requireTask(taskId);
        SubTask subTask = requireSubTask(task, subTaskId);

        String previousTitle = subTask.getTitle();
        String previousDescription = subTask.getDescription();
        Long previousAssigneeId = subTask.getAssignedTo() != null ? subTask.getAssignedTo().getId() : null;

        if (request.getTitle() != null) {
            if (request.getTitle().isBlank()) {
                throw new IllegalArgumentException("title is required");
            }
            subTask.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            subTask.setDescription(request.getDescription());
        }
        if (request.getDueDate() != null) {
            subTask.setDueDate(request.getDueDate());
        }
        if (request.getAssignedToId() != null) {
            User assignee = requireAssignableUser(request.getAssignedToId());
            validateSubTaskScope(task, assignee, callerId);
            Long previous = subTask.getAssignedTo() != null ? subTask.getAssignedTo().getId() : null;
            subTask.setAssignedTo(assignee);
            if (previous == null || !previous.equals(assignee.getId())) {
                notificationService.createNotification(
                        assignee.getId(),
                        "New task",
                        String.format("You have been assigned a subtask on: %s", task.getTitle()),
                        NotificationType.TASK_ASSIGNED,
                        task.getId());
            }
        }

        Long newAssigneeId = subTask.getAssignedTo() != null ? subTask.getAssignedTo().getId() : null;
        boolean contentChanged = !Objects.equals(previousTitle, subTask.getTitle())
                || !Objects.equals(previousDescription, subTask.getDescription())
                || !Objects.equals(previousAssigneeId, newAssigneeId);
        if (contentChanged && subTask.getStatus() != SubTaskStatus.PENDING) {
            subTask.setStatus(SubTaskStatus.PENDING);
        }

        syncParentStatus(task);

        taskRepository.save(task);
        return TaskResponse.mapToResponse(task);
    }

    @Transactional
    public TaskResponse deleteSubTask(Long taskId, Long subTaskId) {
        Task task = requireTask(taskId);
        SubTask subTask = requireSubTask(task, subTaskId);
        task.getSubTasks().remove(subTask);
        subTaskRepository.delete(subTask);
        syncParentStatus(task);
        return TaskResponse.mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse startSubTask(Long taskId, Long subTaskId, Long callerId) {
        Task task = requireTask(taskId);
        SubTask subTask = requireSubTask(task, subTaskId);
        assertSubTaskAssignee(subTask, callerId);
        if (subTask.getStatus() != SubTaskStatus.PENDING) {
            throw new IllegalStateException("Invalid status transition");
        }
        subTask.setStatus(SubTaskStatus.IN_PROGRESS);
        syncParentStatus(task);
        return TaskResponse.mapToResponse(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse completeSubTask(Long taskId, Long subTaskId, Long callerId) {
        Task task = requireTask(taskId);
        SubTask subTask = requireSubTask(task, subTaskId);
        assertSubTaskAssignee(subTask, callerId);
        if (subTask.getStatus() != SubTaskStatus.IN_PROGRESS) {
            throw new IllegalStateException("Invalid status transition");
        }
        TaskStatus previousStatus = task.getStatus();
        subTask.setStatus(SubTaskStatus.DONE);
        syncParentStatus(task);
        Task saved = taskRepository.save(task);

        // All subtasks done -> the task is now waiting for manager review
        if (previousStatus != TaskStatus.DONE && saved.getStatus() == TaskStatus.DONE
                && saved.getCreatedBy() != null
                && (callerId == null || !saved.getCreatedBy().getId().equals(callerId))) {
            notificationService.createNotification(
                    saved.getCreatedBy().getId(),
                    "Task completed",
                    "المهمة بانتظار مراجعتك: " + saved.getTitle(),
                    NotificationType.TASK_COMPLETED,
                    saved.getId());
        }
        return TaskResponse.mapToResponse(saved);
    }

    @Transactional
    public TaskResponse claimFreeTask(Long taskId, Long callerId) {
        Task task = taskRepository.findByIdForUpdate(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        User claimer = requireAssignableUser(callerId);
        if (!TaskResponse.isFree(task)) {
            throw new IllegalStateException("Task is already assigned");
        }
        assertFreeTaskScope(task, claimer);
        task.setAssignedTo(claimer);
        for (SubTask subTask : TaskResponse.liveSubTasks(task)) {
            if (subTask.getStatus() == SubTaskStatus.DONE) {
                continue;
            }
            if (subTask.getAssignedTo() == null) {
                subTask.setAssignedTo(claimer);
            }
        }
        Task saved = taskRepository.save(task);
        if (saved.getCreatedBy() != null && !saved.getCreatedBy().getId().equals(claimer.getId())) {
            notificationService.createNotification(
                    saved.getCreatedBy().getId(),
                    "New task",
                    claimer.getFullName() + " has taken Task " + saved.getTitle() + ".",
                    NotificationType.TASK_ASSIGNED,
                    saved.getId());
        }
        return TaskResponse.mapToResponse(saved);
    }

    @Transactional
    public TaskResponse claimFreeSubTask(Long taskId, Long subTaskId, Long callerId) {
        Task task = taskRepository.findByIdForUpdate(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        User claimer = requireAssignableUser(callerId);
        SubTask subTask = requireSubTask(task, subTaskId);
        if (subTask.getAssignedTo() != null) {
            throw new IllegalStateException("SubTask is already assigned");
        }
        if (subTask.getStatus() == SubTaskStatus.DONE) {
            throw new IllegalStateException("Completed SubTask cannot be claimed");
        }
        if (!TaskResponse.isFree(task) && !isWorkingOn(task, claimer.getId())) {
            throw new SecurityException("Employee cannot claim a SubTask on an unrelated task");
        }
        if (TaskResponse.isFree(task)) {
            assertFreeTaskScope(task, claimer);
        }

        subTask.setAssignedTo(claimer);
        if (task.getAssignedTo() == null) {
            task.setAssignedTo(claimer);
        }
        Task saved = taskRepository.save(task);
        if (saved.getCreatedBy() != null && !saved.getCreatedBy().getId().equals(claimer.getId())) {
            notificationService.createNotification(
                    saved.getCreatedBy().getId(),
                    "New task",
                    claimer.getFullName() + " has taken a free subtask on " + saved.getTitle() + ".",
                    NotificationType.TASK_ASSIGNED,
                    saved.getId());
        }
        return TaskResponse.mapToResponse(saved);
    }

    @Transactional
    public TaskResponse leaveTask(Long taskId, Long callerId) {
        Task task = taskRepository.findByIdForUpdate(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
        User leaver = requireUser(callerId, "User not found");
        if (!isWorkingOn(task, leaver.getId())) {
            throw new IllegalArgumentException("You are not assigned to this task");
        }

        for (SubTask subTask : TaskResponse.liveSubTasks(task)) {
            if (subTask.getAssignedTo() != null && subTask.getAssignedTo().getId().equals(leaver.getId())) {
                subTask.setAssignedTo(null);
            }
        }
        if (task.getAssignedTo() != null && task.getAssignedTo().getId().equals(leaver.getId())) {
            task.setAssignedTo(null);
        }

        List<User> remaining = remainingWorkers(task, leaver.getId());
        if (remaining.isEmpty()) {
            taskRepository.save(task);
            notifyTaskBecameFree(task, leaver);
            return TaskResponse.mapToResponse(task);
        }

        Task saved = taskRepository.save(task);
        String message = "The task/subtasks previously assigned to "
                + leaver.getFullName() + " are now free for the remaining task employees.";
        Set<Long> notified = new HashSet<>();
        for (User worker : remaining) {
            if (!notified.add(worker.getId())) {
                continue;
            }
            notificationService.createNotification(
                    worker.getId(),
                    "New task",
                    message,
                    NotificationType.TASK_ASSIGNED,
                    saved.getId());
        }
        if (saved.getCreatedBy() != null && notified.add(saved.getCreatedBy().getId())) {
            notificationService.createNotification(
                    saved.getCreatedBy().getId(),
                    "New task",
                    message,
                    NotificationType.TASK_ASSIGNED,
                    saved.getId());
        }
        return TaskResponse.mapToResponse(saved);
    }

    public boolean isManager(Long userId) {
        return hasAnyRole(userId, MANAGER_ROLES);
    }

    public void assertManager(Long callerId) {
        if (callerId == null) {
            return;
        }
        if (!isManager(callerId)) {
            throw new SecurityException("Unauthorized manager action");
        }
    }

    public void syncParentStatus(Task task) {
        if (task.getStatus() == TaskStatus.ACCEPTED) {
            return;
        }
        List<SubTask> live = TaskResponse.liveSubTasks(task);
        if (live.isEmpty()) {
            return;
        }
        boolean allDone = live.stream().allMatch(s -> s.getStatus() == SubTaskStatus.DONE);
        boolean anyStarted = live.stream().anyMatch(s -> s.getStatus() != SubTaskStatus.PENDING);
        if (allDone) {
            task.setStatus(TaskStatus.DONE);
        } else if (anyStarted) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        } else {
            task.setStatus(TaskStatus.PENDING);
        }
    }

    private void applyEmployeeStatusUpdate(Task task, TaskRequest request, User caller) {
        boolean assignedToCaller = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(caller.getId());
        if (!assignedToCaller && !isWorkingOn(task, caller.getId())) {
            throw new SecurityException("Unauthorized employee action");
        }
        if (request.getStatus() == null) {
            throw new SecurityException("Unauthorized employee action");
        }
        if (!TaskResponse.liveSubTasks(task).isEmpty()) {
            throw new IllegalStateException("Parent task status is driven by subtasks");
        }
        applyParentStatusChange(task, request.getStatus(), false);
    }

    private void applyParentStatusChange(Task task, TaskStatus newStatus, boolean manager) {
        if (newStatus == task.getStatus()) {
            return;
        }
        if (newStatus == TaskStatus.ACCEPTED) {
            if (!manager) {
                throw new SecurityException("Only a manager can accept a task");
            }
            if (task.getStatus() != TaskStatus.DONE) {
                throw new IllegalStateException("Invalid status transition");
            }
            task.setStatus(TaskStatus.ACCEPTED);
            return;
        }
        if (task.getStatus() == TaskStatus.ACCEPTED) {
            throw new IllegalStateException("Invalid status transition");
        }
        if (!TaskResponse.liveSubTasks(task).isEmpty() && !manager) {
            throw new IllegalStateException("Parent task status is driven by subtasks");
        }
        task.setStatus(newStatus);
    }

    private void cascadeParentAssignment(Task task, User newAssignee) {
        for (SubTask subTask : TaskResponse.liveSubTasks(task)) {
            subTask.setAssignedTo(newAssignee);
        }
    }

    private void syncSubTasks(Task task, List<SubTaskRequest> requests, boolean parentAssignmentChanged) {
        Set<Long> requestedIds = new HashSet<>();
        User parentAssignee = task.getAssignedTo();

        for (SubTaskRequest request : requests) {
            if (request.getId() == null) {
                SubTask subTask = buildSubTask(task, request, parentAssignee);
                task.getSubTasks().add(subTask);
                continue;
            }

            SubTask subTask = requireSubTask(task, request.getId());
            requestedIds.add(subTask.getId());

            String previousTitle = subTask.getTitle();
            String previousDescription = subTask.getDescription();
            Long previousAssigneeId = subTask.getAssignedTo() != null ? subTask.getAssignedTo().getId() : null;

            if (request.getTitle() != null) {
                if (request.getTitle().isBlank()) {
                    throw new IllegalArgumentException("title is required");
                }
                subTask.setTitle(request.getTitle().trim());
            }
            if (request.getDescription() != null) {
                subTask.setDescription(request.getDescription());
            }
            if (request.getDueDate() != null) {
                subTask.setDueDate(request.getDueDate());
            }
            if (!parentAssignmentChanged && request.getAssignedToId() != null) {
                subTask.setAssignedTo(requireAssignableUser(request.getAssignedToId()));
            }

            Long newAssigneeId = subTask.getAssignedTo() != null ? subTask.getAssignedTo().getId() : null;
            boolean subTaskContentChanged = !Objects.equals(previousTitle, subTask.getTitle())
                    || !Objects.equals(previousDescription, subTask.getDescription())
                    || (!parentAssignmentChanged && !Objects.equals(previousAssigneeId, newAssigneeId));
            if (subTaskContentChanged && subTask.getStatus() != SubTaskStatus.PENDING) {
                subTask.setStatus(SubTaskStatus.PENDING);
            }
        }

        List<SubTask> toRemove = TaskResponse.liveSubTasks(task).stream()
                .filter(subTask -> subTask.getId() != null && !requestedIds.contains(subTask.getId()))
                .toList();
        for (SubTask subTask : toRemove) {
            task.getSubTasks().remove(subTask);
            subTaskRepository.delete(subTask);
        }
    }

    private SubTask buildSubTask(Task task, SubTaskRequest request, User defaultAssignee) {
        validateSubTaskCreate(request, defaultAssignee);
        Long assigneeId = request.getAssignedToId() != null ? request.getAssignedToId()
                : (defaultAssignee != null ? defaultAssignee.getId() : null);
        if (assigneeId == null) {
            throw new IllegalArgumentException("assigned employee is required");
        }
        User assignee = requireAssignableUser(assigneeId);
        SubTask subTask = new SubTask();
        subTask.setTask(task);
        subTask.setTitle(request.getTitle().trim());
        subTask.setDescription(request.getDescription());
        subTask.setDueDate(request.getDueDate());
        subTask.setAssignedTo(assignee);
        subTask.setStatus(SubTaskStatus.PENDING);
        subTask.setCreatedAt(LocalDateTime.now());
        return subTask;
    }

    private void validateParentCreate(TaskRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        boolean hasSubTasks = request.getSubtasks() != null && !request.getSubtasks().isEmpty();
        if (!hasSubTasks && request.getAssignedToId() == null) {
            throw new IllegalArgumentException("assigned employee is required");
        }
        if (!hasSubTasks && request.getDueDate() == null) {
            throw new IllegalArgumentException("deadline is required");
        }
        if (request.getCreatedById() == null) {
            throw new IllegalArgumentException("creator is required");
        }
        if (hasSubTasks) {
            User defaultAssignee = request.getAssignedToId() != null
                    ? userRepository.findById(request.getAssignedToId()).orElse(null)
                    : null;
            for (SubTaskRequest subRequest : request.getSubtasks()) {
                validateSubTaskCreate(subRequest, defaultAssignee);
            }
            resolveParentDueDate(request);
        }
    }

    private Long resolveParentAssigneeId(TaskRequest request) {
        if (request.getAssignedToId() != null) {
            return request.getAssignedToId();
        }
        if (request.getSubtasks() != null && !request.getSubtasks().isEmpty()) {
            return request.getSubtasks().get(0).getAssignedToId();
        }
        return null;
    }

    private LocalDateTime resolveParentDueDate(TaskRequest request) {
        if (request.getSubtasks() == null || request.getSubtasks().isEmpty()) {
            return request.getDueDate();
        }
        LocalDateTime latestSubTaskDueDate = request.getSubtasks().stream()
                .map(SubTaskRequest::getDueDate)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElseThrow(() -> new IllegalArgumentException("subtask deadline is required"));
        if (request.getDueDate() != null && request.getDueDate().isBefore(latestSubTaskDueDate)) {
            throw new IllegalArgumentException(
                    "ميعاد تسليم المهمة الرئيسية لا يمكن أن يكون قبل موعد تسليم أي مهمة فرعية");
        }
        return request.getDueDate() != null ? request.getDueDate() : latestSubTaskDueDate;
    }

    private void validateAndSyncParentDueDate(Task task, LocalDateTime requestedParentDueDate) {
        List<SubTask> live = TaskResponse.liveSubTasks(task);
        if (live.isEmpty()) {
            if (task.getDueDate() == null) {
                throw new IllegalArgumentException("deadline is required");
            }
            return;
        }
        LocalDateTime latestSubTaskDueDate = live.stream()
                .map(SubTask::getDueDate)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElseThrow(() -> new IllegalArgumentException("subtask deadline is required"));
        if (live.stream().anyMatch(s -> s.getDueDate() == null)) {
            throw new IllegalArgumentException("subtask deadline is required");
        }
        if (requestedParentDueDate == null) {
            task.setDueDate(latestSubTaskDueDate);
            return;
        }
        if (requestedParentDueDate.isBefore(latestSubTaskDueDate)) {
            throw new IllegalArgumentException(
                    "ميعاد تسليم المهمة الرئيسية لا يمكن أن يكون قبل موعد تسليم أي مهمة فرعية");
        }
    }

    private void validateSubTaskCreate(SubTaskRequest request, User defaultAssignee) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        if (request.getDueDate() == null) {
            throw new IllegalArgumentException("deadline is required");
        }
        if (request.getAssignedToId() == null && defaultAssignee == null) {
            throw new IllegalArgumentException("assigned employee is required");
        }
    }

    private Task requireTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Task not found"));
    }

    private SubTask requireSubTask(Task task, Long subTaskId) {
        return TaskResponse.liveSubTasks(task).stream()
                .filter(s -> Objects.equals(s.getId(), subTaskId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("SubTask does not belong to the specified Task"));
    }

    private User requireUser(Long id, String message) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException(message));
    }

    private User requireAssignableUser(Long id) {
        User user = requireUser(id, "Assigned user not found");
        if (user.getDeletedAt() != null) {
            throw new IllegalArgumentException("Assigned user not found");
        }
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new IllegalArgumentException(
                    "User '" + user.getFullName() + "' has not verified their account yet. " +
                            "They must change their temporary password before tasks can be assigned to them.");
        }
        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.RESIGNED) {
            throw new IllegalArgumentException("Cannot assign a task to an inactive employee");
        }
        return user;
    }

    private void rejectUnverified(User user, String message) {
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            throw new IllegalArgumentException(message);
        }
    }

    private void assertSubTaskAssignee(SubTask subTask, Long callerId) {
        if (callerId == null) {
            throw new SecurityException("Unauthorized employee action");
        }
        if (subTask.getAssignedTo() == null || !subTask.getAssignedTo().getId().equals(callerId)) {
            throw new SecurityException("Employee cannot act on another employee's SubTask");
        }
    }

    /**
     * A subtask assignee must belong to the same Branch + Department as the task.
     * Enforced on the backend; frontend filtering alone is never trusted.
     */
    private void validateSubTaskScope(Task task, User assignee, Long callerId) {
        if (assignee == null || task.getDepartment() == null) {
            return;
        }
        Long branchId = task.getDepartment().getBranch() != null ? task.getDepartment().getBranch().getId() : null;
        authorizationService.validateTaskAssignment(callerId, branchId, task.getDepartment().getId(), assignee.getId());
    }

    /**
     * FREE tasks are only visible/claimable by employees of the same Branch AND
     * Department as the task's team. Tasks without a department keep the legacy
     * open visibility. Managers are not restricted.
     */
    private boolean isInFreeTaskScope(Task task, User user) {
        if (task.getDepartment() == null || task.getDepartment().getBranch() == null) {
            return true;
        }
        return employeeAssignmentRepository.findByUser_Id(user.getId()).stream().anyMatch(a ->
                a.getDepartment() != null
                        && a.getDepartment().getId().equals(task.getDepartment().getId())
                        && a.getBranch() != null
                        && a.getBranch().getId().equals(task.getDepartment().getBranch().getId())
                        && (a.getEndDate() == null || !a.getEndDate().isBefore(java.time.LocalDate.now())));
    }

    private void assertFreeTaskScope(Task task, User claimer) {
        if (isManager(claimer.getId()) || isInFreeTaskScope(task, claimer)) {
            return;
        }
        throw new SecurityException("Free task is limited to employees of the same branch and department");
    }

    private boolean isWorkingOn(Task task, Long userId) {
        if (task.getAssignedTo() != null && task.getAssignedTo().getId().equals(userId)) {
            return true;
        }
        return TaskResponse.liveSubTasks(task).stream()
                .anyMatch(s -> s.getAssignedTo() != null
                        && s.getAssignedTo().getId().equals(userId)
                        && s.getStatus() != SubTaskStatus.DONE);
    }

    private List<User> remainingWorkers(Task task, Long leaverId) {
        return TaskResponse.workingEmployees(task).stream()
                .filter(w -> !w.getId().equals(leaverId))
                .map(w -> userRepository.findById(w.getId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    private void notifyTaskBecameFree(Task task, User leaver) {
        String message = "Task \"" + task.getTitle() + "\" is now available (free). "
                + leaver.getFullName() + " is no longer assigned.";
        Set<Long> notified = new HashSet<>();
        if (task.getCreatedBy() != null) {
            notified.add(task.getCreatedBy().getId());
            notificationService.createNotification(
                    task.getCreatedBy().getId(),
                    "New task",
                    message,
                    NotificationType.TASK_ASSIGNED,
                    task.getId());
        }
        // FREE tasks are only announced to employees of the same Branch + Department
        if (task.getDepartment() != null && task.getDepartment().getBranch() != null) {
            Long scopeBranchId = task.getDepartment().getBranch().getId();
            for (com.accounting.backend.entities.EmployeeAssignment assignment
                    : employeeAssignmentRepository.findByDepartment_Id(task.getDepartment().getId())) {
                if (assignment.getBranch() == null || !assignment.getBranch().getId().equals(scopeBranchId)) {
                    continue;
                }
                User employee = assignment.getUser();
                if (employee == null || employee.getId().equals(leaver.getId()) || notified.contains(employee.getId())) {
                    continue;
                }
                notified.add(employee.getId());
                notificationService.createNotification(
                        employee.getId(),
                        "New task",
                        message,
                        NotificationType.TASK_ASSIGNED,
                        task.getId());
            }
            return;
        }
        for (User employee : userRoleRepository.findUsersByRoleName("employee")) {
            if (employee.getId().equals(leaver.getId()) || notified.contains(employee.getId())) {
                continue;
            }
            notified.add(employee.getId());
            notificationService.createNotification(
                    employee.getId(),
                    "New task",
                    message,
                    NotificationType.TASK_ASSIGNED,
                    task.getId());
        }
    }

    private void notifyDistinctSubtaskAssignees(Task task, Long alreadyNotifiedUserId) {
        Set<Long> notified = new HashSet<>();
        notified.add(alreadyNotifiedUserId);
        for (SubTask subTask : TaskResponse.liveSubTasks(task)) {
            if (subTask.getAssignedTo() == null) {
                continue;
            }
            Long assigneeId = subTask.getAssignedTo().getId();
            if (!notified.add(assigneeId)) {
                continue;
            }
            notificationService.createNotification(
                    assigneeId,
                    "New task",
                    String.format("You have been assigned a subtask on: %s", task.getTitle()),
                    NotificationType.TASK_ASSIGNED,
                    task.getId());
        }
    }

    private boolean hasAnyRole(Long userId, Set<String> roles) {
        return userRoleRepository.findByUser_Id(userId).stream()
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .map(role -> role.getName().toLowerCase(Locale.ROOT))
                .anyMatch(roles::contains);
    }
}
