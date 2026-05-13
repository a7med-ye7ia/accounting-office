package com.accounting.backend.dto;

import com.accounting.backend.enums.TaskStatus;
import java.time.LocalDateTime;

public class TaskRequest {

    private String title;
    private String description;
    private Long assignedToId;
    private Long createdById;
    private TaskStatus status;
    private LocalDateTime dueDate;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }
    @Override
    public String toString() {
        return "CreateTaskRequest [title=" + title + ", description=" + description + ", assignedToId=" + assignedToId
                + ", createdById=" + createdById + ", status=" + status + ", dueDate=" + dueDate + "]";
    }
}