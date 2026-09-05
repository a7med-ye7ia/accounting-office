package com.accounting.backend.dto;

import java.time.LocalDateTime;

import com.accounting.backend.entities.SubTask;
import com.accounting.backend.enums.SubTaskStatus;

public class SubTaskResponse {

    private Long id;
    private String title;
    private String description;
    private Long assignedToId;
    private String assignedToName;
    private LocalDateTime dueDate;
    private SubTaskStatus status;
    private LocalDateTime createdAt;

    public SubTaskResponse() {}

    public SubTaskResponse(Long id, String title, String description,
                           Long assignedToId, String assignedToName,
                           LocalDateTime dueDate, SubTaskStatus status,
                           LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.assignedToId = assignedToId;
        this.assignedToName = assignedToName;
        this.dueDate = dueDate;
        this.status = status;
        this.createdAt = createdAt;
    }

    public static SubTaskResponse from(SubTask subTask) {
        Long assigneeId = subTask.getAssignedTo() != null ? subTask.getAssignedTo().getId() : null;
        String assigneeName = subTask.getAssignedTo() != null ? subTask.getAssignedTo().getFullName() : null;
        return new SubTaskResponse(
                subTask.getId(),
                subTask.getTitle(),
                subTask.getDescription(),
                assigneeId,
                assigneeName,
                subTask.getDueDate(),
                subTask.getStatus(),
                subTask.getCreatedAt()
        );
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Long getAssignedToId() { return assignedToId; }
    public String getAssignedToName() { return assignedToName; }
    public LocalDateTime getDueDate() { return dueDate; }
    public SubTaskStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
