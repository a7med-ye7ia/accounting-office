package com.accounting.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.accounting.backend.entities.Task;
import com.accounting.backend.enums.TaskStatus;

public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private String assignedToName;
    private String createdByName;
    private LocalDateTime dueDate;
    private List<CommentResponse> comments;
    private TaskStatus status;

    public TaskResponse(Long id, String title, String description,
                        String assignedToName, String createdByName,
                        LocalDateTime dueDate, List<CommentResponse> comments, TaskStatus status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.assignedToName = assignedToName;
        this.createdByName = createdByName;
        this.dueDate = dueDate;
        this.comments = comments;
        this.status = status;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getAssignedToName() { return assignedToName; }
    public String getCreatedByName() { return createdByName; }
    public LocalDateTime getDueDate() { return dueDate; }
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
                task.getAssignedTo().getFullName(),
                task.getCreatedBy().getFullName(),
                task.getDueDate(),
                comments,
                task.getStatus()

        );
    }
}