package com.accounting.backend.dto;

public class CommentRequest {
    private Long taskId;
    private Long createdById;
    private String message;

    public Long getTaskId() { return taskId; }
    public void setTaskId(Long taskId) { this.taskId = taskId; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    @Override
    public String toString() {
        return "CommentRequest{" +
                "taskId=" + taskId +
                ", createdById=" + createdById +
                ", message='" + message + '\'' +
                '}';
    }
}
