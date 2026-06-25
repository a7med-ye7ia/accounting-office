package com.accounting.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.entities.Reporting;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.ReportingRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/reportings")
public class ReportingController {

    @Autowired
    private ReportingRepository reportingRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<Reporting> getAllReportings() {
        return reportingRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Reporting> getReportingById(@PathVariable Long id) {
        return reportingRepository.findById(id);
    }

    @PostMapping
    public Reporting createReporting(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Reporting reporting) {
        Reporting saved = reportingRepository.save(reporting);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getEmployee() != null) meta.put("employeeId", saved.getEmployee().getId());
            activityLogService.logAction(callerId, null, EntityType.REPORTING, saved.getId(),
                ActionType.CREATE, "تم إنشاء تقرير", meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public Reporting updateReporting(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Reporting reportingDetails) {
        Reporting reporting = reportingRepository.findById(id).orElseThrow();
        reporting.setEmployee(reportingDetails.getEmployee());
        reporting.setManager(reportingDetails.getManager());
        reporting.setStartDate(reportingDetails.getStartDate());
        reporting.setEndDate(reportingDetails.getEndDate());
        Reporting saved = reportingRepository.save(reporting);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getEmployee() != null) meta.put("employeeId", saved.getEmployee().getId());
            activityLogService.logAction(callerId, null, EntityType.REPORTING, saved.getId(),
                ActionType.UPDATE, "تم تحديث التقرير", meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteReporting(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        reportingRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("reportingId", id);
            activityLogService.logAction(callerId, null, EntityType.REPORTING, id,
                ActionType.DELETE, "تم حذف التقرير", meta);
        }
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
