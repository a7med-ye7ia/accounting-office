package com.accounting.backend.dtos;

import com.accounting.backend.entities.Guide;
import com.accounting.backend.entities.GuideStep;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

public class GuideResponse {
    private Long id;
    private String title;
    private String category;
    private String description;
    private String icon;
    private String color;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long createdById;
    private String createdByName;
    private Long updatedById;
    private String updatedByName;
    private List<GuideStepResponse> steps;

    public static GuideResponse from(Guide guide) {
        GuideResponse response = new GuideResponse();
        response.id = guide.getId();
        response.title = guide.getTitle();
        response.category = guide.getCategory();
        response.description = guide.getDescription();
        response.icon = guide.getIcon();
        response.color = guide.getColor();
        response.status = guide.getStatus();
        response.createdAt = guide.getCreatedAt();
        response.updatedAt = guide.getUpdatedAt();
        if (guide.getCreatedBy() != null) {
            response.createdById = guide.getCreatedBy().getId();
            response.createdByName = guide.getCreatedBy().getFullName();
        }
        if (guide.getUpdatedBy() != null) {
            response.updatedById = guide.getUpdatedBy().getId();
            response.updatedByName = guide.getUpdatedBy().getFullName();
        }
        response.steps = guide.getSteps().stream()
                .sorted(Comparator.comparing(GuideStep::getStepOrder))
                .map(GuideStepResponse::from)
                .toList();
        return response;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public String getIcon() { return icon; }
    public String getColor() { return color; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getCreatedById() { return createdById; }
    public String getCreatedByName() { return createdByName; }
    public Long getUpdatedById() { return updatedById; }
    public String getUpdatedByName() { return updatedByName; }
    public List<GuideStepResponse> getSteps() { return steps; }

    public static class GuideStepResponse {
        private Long id;
        private Integer order;
        private String title;
        private String description;
        private String note;
        private String entityName;
        private Long companyId;

        static GuideStepResponse from(GuideStep step) {
            GuideStepResponse response = new GuideStepResponse();
            response.id = step.getId();
            response.order = step.getStepOrder();
            response.title = step.getTitle();
            response.description = step.getDescription();
            response.note = step.getNote();
            response.entityName = step.getEntityName();
            response.companyId = step.getCompanyId();
            return response;
        }

        public Long getId() { return id; }
        public Integer getOrder() { return order; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public String getNote() { return note; }
        public String getEntityName() { return entityName; }
        public Long getCompanyId() { return companyId; }
    }
}
