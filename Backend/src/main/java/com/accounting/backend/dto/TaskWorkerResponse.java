package com.accounting.backend.dto;

public class TaskWorkerResponse {

    private Long id;
    private String fullName;

    public TaskWorkerResponse() {}

    public TaskWorkerResponse(Long id, String fullName) {
        this.id = id;
        this.fullName = fullName;
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
}
