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

import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/employee-assignments")
public class EmployeeAssignmentController {

    @Autowired
    private EmployeeAssignmentRepository employeeAssignmentRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<EmployeeAssignment> getAllEmployeeAssignments() {
        return employeeAssignmentRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<EmployeeAssignment> getEmployeeAssignmentById(@PathVariable Long id) {
        return employeeAssignmentRepository.findById(id);
    }

    @PostMapping
    public EmployeeAssignment createEmployeeAssignment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody EmployeeAssignment employeeAssignment) {
        EmployeeAssignment saved = employeeAssignmentRepository.save(employeeAssignment);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getUser() != null) meta.put("userId", saved.getUser().getId());
            if (saved.getDepartment() != null) meta.put("department", saved.getDepartment().getName());
            if (saved.getBranch() != null) meta.put("branch", saved.getBranch().getName());
            activityLogService.logAction(callerId, null, EntityType.EMPLOYEE_ASSIGNMENT, saved.getId(),
                ActionType.CREATE, "تم إنشاء تعيين موظف", meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public EmployeeAssignment updateEmployeeAssignment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody EmployeeAssignment employeeAssignmentDetails) {
        EmployeeAssignment ea = employeeAssignmentRepository.findById(id).orElseThrow();
        ea.setUser(employeeAssignmentDetails.getUser());
        ea.setBranch(employeeAssignmentDetails.getBranch());
        ea.setDepartment(employeeAssignmentDetails.getDepartment());
        ea.setIsPrimary(employeeAssignmentDetails.getIsPrimary());
        ea.setStartDate(employeeAssignmentDetails.getStartDate());
        ea.setEndDate(employeeAssignmentDetails.getEndDate());
        EmployeeAssignment saved = employeeAssignmentRepository.save(ea);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("assignmentId", saved.getId());
            activityLogService.logAction(callerId, null, EntityType.EMPLOYEE_ASSIGNMENT, saved.getId(),
                ActionType.UPDATE, "تم تحديث تعيين الموظف", meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteEmployeeAssignment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        employeeAssignmentRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("assignmentId", id);
            activityLogService.logAction(callerId, null, EntityType.EMPLOYEE_ASSIGNMENT, id,
                ActionType.DELETE, "تم حذف تعيين الموظف", meta);
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
