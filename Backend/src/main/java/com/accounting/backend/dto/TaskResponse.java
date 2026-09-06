package com.accounting.backend.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.accounting.backend.entities.SubTask;
import com.accounting.backend.entities.Task;
import com.accounting.backend.enums.SubTaskStatus;
import com.accounting.backend.enums.TaskStatus;

public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private Long assignedToId;
    private String assignedToName;
    private Long createdById;
    private String createdByName;
    private Long branchId;
    private String branchName;
    private Long departmentId;
    private String departmentName;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private List<CommentResponse> comments;
    private TaskStatus status;
    private List<SubTaskResponse> subtasks = new ArrayList<>();
    private List<TaskWorkerResponse> workingEmployees = new ArrayList<>();
    private boolean free;

    public TaskResponse(Long id, String title, String description,
                        Long assignedToId, String assignedToName, String createdByName,
                        LocalDateTime dueDate, LocalDateTime createdAt, List<CommentResponse> comments, TaskStatus status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.assignedToId = assignedToId;
        this.assignedToName = assignedToName;
        this.createdByName = createdByName;
        this.dueDate = dueDate;
        this.createdAt = createdAt;
        this.comments = comments;
        this.status = status;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Long getAssignedToId() { return assignedToId; }
    public String getAssignedToName() { return assignedToName; }
    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }
    public String getCreatedByName() { return createdByName; }
    public LocalDateTime getDueDate() { return dueDate; }
    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }
    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<CommentResponse> getComments() { return comments; }
    public TaskStatus getStatus() { return status; }
    public List<SubTaskResponse> getSubtasks() { return subtasks; }
    public void setSubtasks(List<SubTaskResponse> subtasks) { this.subtasks = subtasks; }
    public List<TaskWorkerResponse> getWorkingEmployees() { return workingEmployees; }
    public void setWorkingEmployees(List<TaskWorkerResponse> workingEmployees) { this.workingEmployees = workingEmployees; }
    public boolean isFree() { return free; }
    public void setFree(boolean free) { this.free = free; }

    public static TaskResponse mapToResponse(Task task) {
        List<CommentResponse> comments = (task.getComments() == null ? List.<com.accounting.backend.entities.TaskComment>of() : task.getComments())
            .stream()
            .map(c -> new CommentResponse(
                    c.getId(),
                    c.getMessage(),
                    c.getCommentBy() != null ? c.getCommentBy().getFullName() : null,
                    c.getCreatedAt()
            ))
            .toList();

        Long assignedId = task.getAssignedTo() != null ? task.getAssignedTo().getId() : null;
        String assignedName = task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : null;
        String creatorName = task.getCreatedBy() != null ? task.getCreatedBy().getFullName() : null;

        TaskResponse response = new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                assignedId,
                assignedName,
                creatorName,
                task.getDueDate(),
                task.getCreatedAt(),
                comments,
                task.getStatus()
        );

        if (task.getCreatedBy() != null) {
            response.setCreatedById(task.getCreatedBy().getId());
        }

        if (task.getDepartment() != null) {
            response.setDepartmentId(task.getDepartment().getId());
            response.setDepartmentName(task.getDepartment().getName());
            if (task.getDepartment().getBranch() != null) {
                response.setBranchId(task.getDepartment().getBranch().getId());
                response.setBranchName(task.getDepartment().getBranch().getName());
            }
        }

        List<SubTask> liveSubtasks = liveSubTasks(task);
        response.setSubtasks(liveSubtasks.stream().map(SubTaskResponse::from).toList());
        response.setWorkingEmployees(workingEmployees(task));
        response.setFree(isFree(task));
        return response;
    }

    public static List<SubTask> liveSubTasks(Task task) {
        if (task.getSubTasks() == null) {
            return List.of();
        }
        return task.getSubTasks().stream()
                .filter(s -> s.getDeletedAt() == null)
                .sorted(Comparator.comparing(SubTask::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();
    }

    public static boolean isFree(Task task) {
        if (task.getAssignedTo() != null) {
            return false;
        }
        return liveSubTasks(task).stream().noneMatch(s ->
                s.getAssignedTo() != null && s.getStatus() != SubTaskStatus.DONE);
    }

    public static List<TaskWorkerResponse> workingEmployees(Task task) {
        Map<Long, String> workers = new LinkedHashMap<>();
        if (task.getAssignedTo() != null) {
            workers.put(task.getAssignedTo().getId(), task.getAssignedTo().getFullName());
        }
        for (SubTask subTask : liveSubTasks(task)) {
            if (subTask.getAssignedTo() != null && subTask.getStatus() != SubTaskStatus.DONE) {
                workers.put(subTask.getAssignedTo().getId(), subTask.getAssignedTo().getFullName());
            }
        }
        return workers.entrySet().stream()
                .map(e -> new TaskWorkerResponse(e.getKey(), e.getValue()))
                .toList();
    }
}
