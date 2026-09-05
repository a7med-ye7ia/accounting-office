package com.accounting.backend.controllers;

import com.accounting.backend.entities.Department;
import com.accounting.backend.entities.DepartmentManagerDepartment;
import com.accounting.backend.entities.DepartmentManagerDepartmentId;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.DepartmentManagerDepartmentRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.AuthorizationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/department-managers")
public class DepartmentManagerController {

    @Autowired
    private DepartmentManagerDepartmentRepository departmentManagerDepartmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping("/{managerId}/departments")
    public ResponseEntity<?> getManagedDepartments(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long managerId) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.canViewUser(caller.getId(), managerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بعرض أقسام هذا المدير"));
        }

        List<DepartmentManagerDepartment> dmdList = departmentManagerDepartmentRepository.findById_ManagerId(managerId);
        List<Department> depts = dmdList.stream()
                .map(DepartmentManagerDepartment::getDepartment)
                .filter(d -> d != null)
                .toList();

        return ResponseEntity.ok(depts);
    }

    @PostMapping("/{managerId}/departments/{departmentId}")
    public ResponseEntity<?> assignDepartmentToManager(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long managerId,
            @PathVariable Long departmentId) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole != SystemRole.OWNER && callerRole != SystemRole.BRANCH_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط المالك ومدير الفرع يمكنهما إسناد أقسام للمدير"));
        }

        Department department = departmentRepository.findById(departmentId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "القسم غير موجود"));

        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (department.getBranch() == null || !department.getBranch().getId().equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير الفرع إسناد قسم خارج فرعه"));
            }
            Long managerBranch = authorizationService.getUserBranchId(managerId);
            if (managerBranch == null || !managerBranch.equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير الفرع إسناد أقسام لمدير خارج فرعه"));
            }
        }

        User manager = userRepository.findById(managerId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "المستخدم غير موجود"));

        DepartmentManagerDepartment dmd = new DepartmentManagerDepartment(manager, department);
        DepartmentManagerDepartment saved = departmentManagerDepartmentRepository.save(dmd);

        Map<String, Object> meta = new HashMap<>();
        meta.put("managerId", managerId);
        meta.put("departmentId", departmentId);
        meta.put("departmentName", department.getName());
        activityLogService.logAction(callerId, null, EntityType.DEPARTMENT, departmentId,
                ActionType.CREATE, "تم إسناد إدارة قسم " + department.getName() + " للمدير #" + managerId, meta);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{managerId}/departments/{departmentId}")
    public ResponseEntity<?> removeDepartmentFromManager(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long managerId,
            @PathVariable Long departmentId) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole != SystemRole.OWNER && callerRole != SystemRole.BRANCH_MANAGER) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط المالك ومدير الفرع يمكنهما إلغاء إسناد الأقسام"));
        }

        Department department = departmentRepository.findById(departmentId).orElse(null);
        if (department != null && callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (department.getBranch() == null || !department.getBranch().getId().equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير الفرع تعديل أقسام خارج فرعه"));
            }
        }

        DepartmentManagerDepartmentId id = new DepartmentManagerDepartmentId(managerId, departmentId);
        departmentManagerDepartmentRepository.deleteById(id);

        Map<String, Object> meta = new HashMap<>();
        meta.put("managerId", managerId);
        meta.put("departmentId", departmentId);
        activityLogService.logAction(callerId, null, EntityType.DEPARTMENT, departmentId,
                ActionType.DELETE, "تم إلغاء إسناد قسم #" + departmentId + " من المدير #" + managerId, meta);

        return ResponseEntity.ok().build();
    }
}
