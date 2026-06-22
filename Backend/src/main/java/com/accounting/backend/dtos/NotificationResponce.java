package com.accounting.backend.dtos;

import java.time.LocalDateTime;

import com.accounting.backend.enums.NotificationType;

public class NotificationResponce {
  private Long id;
  private String title;
  private String message;
  private boolean read;
  private NotificationType type;
  private Long referenceId;
  private LocalDateTime createdAt;
  
  public NotificationResponce() {
  }

  public NotificationResponce(Long id, String title, String message, boolean read, NotificationType type,
      Long referenceId, LocalDateTime createdAt) {
    this.id = id;
    this.title = title;
    this.message = message;
    this.read = read;
    this.type = type;
    this.referenceId = referenceId;
    this.createdAt = createdAt;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public boolean isRead() {
    return read;
  }

  public void setRead(boolean read) {
    this.read = read;
  }

  public NotificationType getType() {
    return type;
  }

  public void setType(NotificationType type) {
    this.type = type;
  }

  public Long getReferenceId() {
    return referenceId;
  }

  public void setReferenceId(Long referenceId) {
    this.referenceId = referenceId;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  
}
