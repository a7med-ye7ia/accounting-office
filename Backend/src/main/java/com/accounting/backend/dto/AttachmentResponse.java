package com.accounting.backend.dto;

import com.accounting.backend.entities.Attachment;

import java.time.LocalDateTime;

public class AttachmentResponse {
    private Long id;
    private String originalFileName;
    private String contentType;
    private long fileSize;
    private String uploadedBy;
    private LocalDateTime createdAt;

    public static AttachmentResponse from(Attachment attachment) {
        AttachmentResponse response = new AttachmentResponse();
        response.id = attachment.getId();
        response.originalFileName = attachment.getOriginalFileName();
        response.contentType = attachment.getContentType();
        response.fileSize = attachment.getFileSize();
        response.uploadedBy = attachment.getUploadedBy() != null
                ? attachment.getUploadedBy().getFullName() : null;
        response.createdAt = attachment.getCreatedAt();
        return response;
    }

    public Long getId() { return id; }
    public String getOriginalFileName() { return originalFileName; }
    public String getContentType() { return contentType; }
    public long getFileSize() { return fileSize; }
    public String getUploadedBy() { return uploadedBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
