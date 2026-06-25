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
    private String createdByName;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private List<CommentResponse> comments;
    private TaskStatus status;

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
    public String getCreatedByName() { return createdByName; }
    public LocalDateTime getDueDate() { return dueDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<CommentResponse> getComments() { return comments; }
    public TaskStatus getStatus() { return status; }

    public static TaskResponse mapToResponse(Task task) {

        List<CommentResponse> comments = task.getComments()
            .stream()
            .map(c -> new CommentResponse(
                    c.getId(),
                    c.getMessage(),
                    c.getCommentBy().getFullName(),
                    c.getCreatedAt()
            ))
            .toList();

        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getAssignedTo().getId(),
                task.getAssignedTo().getFullName(),
                task.getCreatedBy().getFullName(),
                task.getDueDate(),
                task.getCreatedAt(),
                comments,
                task.getStatus()

        );
    }
}