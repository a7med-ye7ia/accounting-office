package com.accounting.backend.entity;

public class Task {
  private String id;
  private String title;
  private String assignee;
  private String assigneeName;
  private String priority;
  private String deadline;
  private String stage;
  
  public Task(String id, String title, String assignee, String assigneeName, String priority, String deadline,
      String stage) {
    this.id = id;
    this.title = title;
    this.assignee = assignee;
    this.assigneeName = assigneeName;
    this.priority = priority;
    this.deadline = deadline;
    this.stage = stage;
  }

  public Task() {
  }

  public String getId() {
    return id;
  }

  public String getTitle() {
    return title;
  }

  public String getAssignee() {
    return assignee;
  }

  public String getAssigneeName() {
    return assigneeName;
  }

  public String getPriority() {
    return priority;
  }

  public String getDeadline() {
    return deadline;
  }

  public String getStage() {
    return stage;
  }

  public void setId(String id) {
    this.id = id;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public void setAssignee(String assignee) {
    this.assignee = assignee;
  }

  public void setAssigneeName(String assigneeName) {
    this.assigneeName = assigneeName;
  }

  public void setPriority(String priority) {
    this.priority = priority;
  }

  public void setDeadline(String deadline) {
    this.deadline = deadline;
  }

  public void setStage(String stage) {
    this.stage = stage;
  }

  @Override
  public String toString() {
    return "Task [id=" + id + ", title=" + title + ", assignee=" + assignee + ", assigneeName=" + assigneeName
        + ", priority=" + priority + ", deadline=" + deadline + ", stage=" + stage + "]";
  }
  
}
