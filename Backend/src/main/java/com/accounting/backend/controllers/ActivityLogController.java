package com.accounting.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.accounting.backend.entities.ActivityLog;
import com.accounting.backend.repositories.ActivityLogRepository;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/activity-logs")
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;

    public ActivityLogController(ActivityLogRepository activityLogRepository) {
        this.activityLogRepository = activityLogRepository;
    }

    @GetMapping
    public ResponseEntity<List<ActivityLog>> getAllLogs(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        List<ActivityLog> logs = activityLogRepository.findAllByOrderByCreatedAtDesc();
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<ActivityLog>> getCompanyLogs(
            @PathVariable Long companyId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        // Fetch logs sorted by newest first
        List<ActivityLog> logs = activityLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        return ResponseEntity.ok(logs);
    }
}