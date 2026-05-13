package com.accounting.backend.dto;

import java.time.LocalDateTime;

public class CommentResponse {

    private Long id;
    private String message;
    private String createdByName;
    private LocalDateTime createdAt;

    public CommentResponse(Long id, String message, String createdByName, LocalDateTime createdAt) {
        this.id = id;
        this.message = message;
        this.createdByName = createdByName;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getMessage() { return message; }
    public String getCreatedByName() { return createdByName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}