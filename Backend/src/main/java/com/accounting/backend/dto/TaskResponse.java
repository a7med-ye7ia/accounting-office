package com.accounting.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.accounting.backend.entities.Task;
import com.accounting.backend.enums.TaskStatus;

public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private Long assignedToId;
    private String assignedToName;
    private Long createdById;
    private String createdByName;
    private Long companyId;
    private String companyName;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private List<CommentResponse> comments;
    private TaskStatus status;

    public TaskResponse(Long id, String title, String description,
                        Long assignedToId, String assignedToName, Long createdById, String createdByName,
                        Long companyId, String companyName,
                        LocalDateTime dueDate, LocalDateTime createdAt, List<CommentResponse> comments, TaskStatus status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.assignedToId = assignedToId;
        this.assignedToName = assignedToName;
        this.createdById = createdById;
        this.createdByName = createdByName;
        this.companyId = companyId;
        this.companyName = companyName;
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
    public String getCreatedByName() { return createdByName; }
    public Long getCompanyId() { return companyId; }
    public String getCompanyName() { return companyName; }
    public LocalDateTime getDueDate() { return dueDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<CommentResponse> getComments() { return comments; }
    public TaskStatus getStatus() { return status; }

    public static TaskResponse mapToResponse(Task task) {
        List<CommentResponse> comments = task.getComments() != null
            ? task.getComments().stream()
                .map(c -> new CommentResponse(
                        c.getId(),
                        c.getMessage(),
                        c.getCommentBy() != null ? c.getCommentBy().getFullName() : null,
                        c.getCreatedAt()
                ))
                .toList()
            : List.of();

        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getAssignedTo() != null ? task.getAssignedTo().getId() : null,
                task.getAssignedTo() != null ? task.getAssignedTo().getFullName() : null,
                task.getCreatedBy() != null ? task.getCreatedBy().getId() : null,
                task.getCreatedBy() != null ? task.getCreatedBy().getFullName() : null,
                task.getCompany() != null ? task.getCompany().getId() : null,
                task.getCompany() != null ? task.getCompany().getName() : null,
                task.getDueDate(),
                task.getCreatedAt(),
                comments,
                task.getStatus()
        );
    }
}