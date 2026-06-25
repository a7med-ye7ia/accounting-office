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

import com.accounting.backend.entities.Department;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Department> getDepartmentById(@PathVariable Long id) {
        return departmentRepository.findById(id);
    }

    @PostMapping
    public Department createDepartment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Department department) {
        Department saved = departmentRepository.save(department);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("departmentName", saved.getName());
            activityLogService.logAction(callerId, null, EntityType.DEPARTMENT, saved.getId(),
                ActionType.CREATE, "تم إنشاء قسم: " + saved.getName(), meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public Department updateDepartment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Department departmentDetails) {
        Department department = departmentRepository.findById(id).orElseThrow();
        department.setName(departmentDetails.getName());
        department.setBranch(departmentDetails.getBranch());
        Department saved = departmentRepository.save(department);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("departmentName", saved.getName());
            activityLogService.logAction(callerId, null, EntityType.DEPARTMENT, saved.getId(),
                ActionType.UPDATE, "تم تحديث القسم: " + saved.getName(), meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteDepartment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Department department = departmentRepository.findById(id).orElse(null);
        if (department == null) return;
        String name = department.getName();
        departmentRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("departmentName", name);
            activityLogService.logAction(callerId, null, EntityType.DEPARTMENT, id,
                ActionType.DELETE, "تم حذف القسم: " + name, meta);
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
