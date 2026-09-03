package com.accounting.backend.dtos;

import java.util.List;

public class GuideRequest {
    private String title;
    private String category;
    private String description;
    private String icon;
    private String color;
    private String status;
    private List<GuideStepRequest> steps;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<GuideStepRequest> getSteps() { return steps; }
    public void setSteps(List<GuideStepRequest> steps) { this.steps = steps; }
}
