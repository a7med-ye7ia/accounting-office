package com.accounting.backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.accounting.backend.entities.ActivityLog;
import com.accounting.backend.entities.Company;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.ActivityLogRepository;
import com.accounting.backend.repositories.CompanyRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.AuthorizationService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/activity-logs")
public class ActivityLogController {

    private final ActivityLogRepository activityLogRepository;
    private final ActivityLogService activityLogService;
    private final JwtService jwtService;
    private final AuthorizationService authorizationService;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public ActivityLogController(ActivityLogRepository activityLogRepository,
                                 ActivityLogService activityLogService,
                                 JwtService jwtService,
                                 AuthorizationService authorizationService,
                                 UserRepository userRepository,
                                 CompanyRepository companyRepository) {
        this.activityLogRepository = activityLogRepository;
        this.activityLogService = activityLogService;
        this.jwtService = jwtService;
        this.authorizationService = authorizationService;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    @GetMapping
    public ResponseEntity<List<ActivityLog>> getAllLogs(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole role = authorizationService.getUserRole(callerId);

        List<ActivityLog> allLogs = activityLogRepository.findAllByOrderByCreatedAtDesc();

        List<ActivityLog> scopedLogs = allLogs.stream()
                .filter(log -> {
                    if (log.getUserId() == null) {
                        return role == SystemRole.OWNER;
                    }
                    return authorizationService.canViewUserActivity(callerId, log.getUserId());
                })
                .toList();

        populateUserNames(scopedLogs);
        return ResponseEntity.ok(scopedLogs);
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<ActivityLog>> getCompanyLogs(
            @PathVariable Long companyId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole role = authorizationService.getUserRole(callerId);

        Company company = companyRepository.findById(companyId).orElse(null);
        if (company == null || !authorizationService.canViewCompany(callerId, company)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ActivityLog> logs = activityLogRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);

        List<ActivityLog> scopedLogs = logs.stream()
                .filter(log -> {
                    if (log.getUserId() == null) {
                        return role == SystemRole.OWNER;
                    }
                    return authorizationService.canViewUserActivity(callerId, log.getUserId());
                })
                .toList();

        populateUserNames(scopedLogs);
        return ResponseEntity.ok(scopedLogs);
    }

    private void populateUserNames(List<ActivityLog> logs) {
        if (logs == null || logs.isEmpty()) return;

        List<Long> userIds = logs.stream()
                .map(ActivityLog::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (userIds.isEmpty()) return;

        Map<Long, String> userNames = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        u -> u.getFullName() != null ? u.getFullName() : u.getEmail(),
                        (existing, replacement) -> existing
                ));

        for (ActivityLog log : logs) {
            if (log.getUserId() != null) {
                log.setUserName(userNames.getOrDefault(log.getUserId(), "المستخدم #" + log.getUserId()));
            }
        }
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
