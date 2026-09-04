package com.accounting.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.server.ResponseStatusException;

import com.accounting.backend.entities.Branch;
import com.accounting.backend.entities.Department;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.AuthorizationService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/departments")
public class DepartmentController {

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private AuthorizationService authorizationService;

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
    public ResponseEntity<?> createDepartment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Department department) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole != SystemRole.OWNER && callerRole != SystemRole.BRANCH_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط المالك ومدير الفرع يمكنهما إنشاء أقسام"));
        }

        if (department.getBranch() == null || department.getBranch().getId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "الفرع مطلوب لإنشاء القسم"));
        }

        Long branchId = department.getBranch().getId();
        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (!branchId.equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير الفرع إنشاء قسم في فرع آخر"));
            }
        }

        Branch branch = branchRepository.findById(branchId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "الفرع المحدد غير موجود"));
        department.setBranch(branch);

        Department saved = departmentRepository.save(department);

        Map<String, Object> meta = new HashMap<>();
        meta.put("departmentName", saved.getName());
        meta.put("branchName", branch.getName());
        activityLogService.logAction(callerId, null, EntityType.DEPARTMENT, saved.getId(),
            ActionType.CREATE, "تم إنشاء قسم: " + saved.getName(), meta);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDepartment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Department departmentDetails) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole != SystemRole.OWNER && callerRole != SystemRole.BRANCH_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بتعديل الأقسام"));
        }

        Department department = departmentRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "القسم غير موجود"));

        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (department.getBranch() == null || !department.getBranch().getId().equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "غير مصرح لك بتعديل قسم خارج فرعك"));
            }
            // Branch manager cannot move department to another branch
            if (departmentDetails.getBranch() != null && !departmentDetails.getBranch().getId().equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير الفرع نقل القسم إلى فرع آخر"));
            }
        }

        if (departmentDetails.getName() != null && !departmentDetails.getName().isBlank()) {
            department.setName(departmentDetails.getName().trim());
        }

        if (callerRole == SystemRole.OWNER && departmentDetails.getBranch() != null && departmentDetails.getBranch().getId() != null) {
            Branch branch = branchRepository.findById(departmentDetails.getBranch().getId()).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.NOT_FOUND, "الفرع المحدد غير موجود"));
            department.setBranch(branch);
        }

        Department saved = departmentRepository.save(department);

        Map<String, Object> meta = new HashMap<>();
        meta.put("departmentName", saved.getName());
        activityLogService.logAction(callerId, null, EntityType.DEPARTMENT, saved.getId(),
            ActionType.UPDATE, "تم تحديث القسم: " + saved.getName(), meta);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDepartment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole != SystemRole.OWNER && callerRole != SystemRole.BRANCH_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بحذف الأقسام"));
        }

        Department department = departmentRepository.findById(id).orElse(null);
        if (department == null) {
            return ResponseEntity.notFound().build();
        }

        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (department.getBranch() == null || !department.getBranch().getId().equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "غير مصرح لك بحذف قسم خارج فرعك"));
            }
        }

        String name = department.getName();
        departmentRepository.deleteById(id);

        Map<String, Object> meta = new HashMap<>();
        meta.put("departmentName", name);
        activityLogService.logAction(callerId, null, EntityType.DEPARTMENT, id,
            ActionType.DELETE, "تم حذف القسم: " + name, meta);

        return ResponseEntity.ok().build();
    }
}
