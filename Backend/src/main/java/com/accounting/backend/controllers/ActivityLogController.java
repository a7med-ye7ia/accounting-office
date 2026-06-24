package com.accounting.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.accounting.backend.entities.ActivityLog;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.ActivityLogRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/activity-logs")
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;
    private final ActivityLogService activityLogService;
    private final JwtService jwtService;

    public ActivityLogController(ActivityLogRepository activityLogRepository,
                                 ActivityLogService activityLogService,
                                 JwtService jwtService) {
        this.activityLogRepository = activityLogRepository;
        this.activityLogService = activityLogService;
        this.jwtService = jwtService;
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

        List<ActivityLog> logs = activityLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/amendment")
    public ResponseEntity<?> logAmendment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> body) {

        Long callerId = extractUserId(authHeader);
        if (callerId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Authentication required"));
        }

        Long companyId = body.get("companyId") != null
                ? ((Number) body.get("companyId")).longValue() : null;
        String companyName = (String) body.get("companyName");
        @SuppressWarnings("unchecked")
        List<Map<String, String>> sections = (List<Map<String, String>>) body.get("sections");

        if (sections == null || sections.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No sections provided"));
        }

        int articleCount = sections.size();
        String summary = "تم إنشاء عقد تعديل بالذكاء الاصطناعي"
                + (companyName != null ? " للشركة: " + companyName : "");

        Map<String, Object> meta = new HashMap<>();
        meta.put("companyName", companyName);
        meta.put("articleCount", articleCount);
        meta.put("sections", sections);

        activityLogService.logAction(
                callerId, companyId, EntityType.AI_AMENDMENT, null,
                ActionType.CREATE, summary, meta);

        return ResponseEntity.ok(Map.of("message", "Amendment logged"));
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            return jwtService.extractUserId(authHeader.substring(7).trim());
        } catch (Exception e) {
            return null;
        }
    }
}
