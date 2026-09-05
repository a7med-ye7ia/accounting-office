package com.accounting.backend.dto;

import com.accounting.backend.enums.TaskStatus;
import java.time.LocalDateTime;
import java.util.List;

public class TaskRequest {

    private String title;
    private String description;
    private Long assignedToId;
    private Long createdById;
    private Long companyId;
    private TaskStatus status;
    private LocalDateTime dueDate;
    private List<SubTaskRequest> subtasks;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Long assignedToId) { this.assignedToId = assignedToId; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public List<SubTaskRequest> getSubtasks() { return subtasks; }
    public void setSubtasks(List<SubTaskRequest> subtasks) { this.subtasks = subtasks; }

    @Override
    public String toString() {
        return "CreateTaskRequest [title=" + title + ", description=" + description + ", assignedToId=" + assignedToId
                + ", createdById=" + createdById + ", companyId=" + companyId + ", status=" + status + ", dueDate=" + dueDate + "]";
    }
}
