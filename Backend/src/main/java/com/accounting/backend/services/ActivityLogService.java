package com.accounting.backend.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import com.accounting.backend.entities.ActivityLog;
import com.accounting.backend.repositories.ActivityLogRepository;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.ActionType;

import java.util.Map;

@Service
public class ActivityLogService {

    private final ActivityLogRepository repository;
    // 1. Initialize it directly here instead of asking Spring for it
    private final ObjectMapper objectMapper = new ObjectMapper(); 

    // 2. Remove ObjectMapper from this constructor
    public ActivityLogService(ActivityLogRepository repository) {
        this.repository = repository;
    }

    public void logAction(Long userId, Long companyId, EntityType entityType, 
                          Long entityId, ActionType action, String summary, 
                          Map<String, Object> metadataMap) {
        
        ActivityLog log = new ActivityLog();
        log.setUserId(userId);
        log.setCompanyId(companyId);
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setAction(action);
        log.setSummary(summary);

        try {
            if (metadataMap != null && !metadataMap.isEmpty()) {
                log.setMetadata(objectMapper.writeValueAsString(metadataMap));
            }
        } catch (JsonProcessingException e) {
            System.err.println("Failed to parse metadata to JSON: " + e.getMessage());
        }

        try {
            repository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to save activity log: " + e.getMessage());
        }
    }
}