package com.accounting.backend.dto;

public class PartnerDto {
    private String title; // e.g. السيد / السيده
    private String name;
    private String role;  // e.g. مالك / شريكه

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
