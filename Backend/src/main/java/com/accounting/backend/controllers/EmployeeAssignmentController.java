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
import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.AuthorizationService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/employee-assignments")
public class EmployeeAssignmentController {

    @Autowired
    private EmployeeAssignmentRepository employeeAssignmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<EmployeeAssignment>> getAllEmployeeAssignments(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole role = authorizationService.getUserRole(callerId);

        List<EmployeeAssignment> assignments;
        if (role == SystemRole.OWNER) {
            assignments = employeeAssignmentRepository.findAll();
        } else if (role == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            assignments = employeeAssignmentRepository.findAll().stream()
                    .filter(a -> a.getUser() != null && !authorizationService.isOwner(a.getUser().getId()))
                    .filter(a -> a.getBranch() != null && a.getBranch().getId().equals(callerBranch))
                    .toList();
        } else if (role == SystemRole.DEPARTMENT_MANAGER) {
            List<Long> managed = authorizationService.getManagedDepartmentIds(callerId);
            assignments = employeeAssignmentRepository.findAll().stream()
                    .filter(a -> a.getUser() != null && !authorizationService.isOwner(a.getUser().getId()))
                    .filter(a -> a.getDepartment() != null && managed.contains(a.getDepartment().getId()))
                    .toList();
        } else {
            // EMPLOYEE
            assignments = employeeAssignmentRepository.findByUser_Id(callerId);
        }

        return ResponseEntity.ok(assignments);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeAssignment> getEmployeeAssignmentById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        EmployeeAssignment assignment = employeeAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "التعيين غير موجود"));

        if (assignment.getUser() != null && !authorizationService.canViewUser(caller.getId(), assignment.getUser().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "غير مصرح لك بعرض هذا التعيين");
        }

        return ResponseEntity.ok(assignment);
    }

    @PostMapping
    public ResponseEntity<?> createEmployeeAssignment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody EmployeeAssignment employeeAssignment) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole == SystemRole.EMPLOYEE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "الموظفون لا يملكون صلاحية إنشاء تعيينات"));
        }

        if (employeeAssignment.getBranch() == null || employeeAssignment.getDepartment() == null || employeeAssignment.getUser() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "المستخدم والفرع والقسم حقول مطلوبة"));
        }

        Long branchId = employeeAssignment.getBranch().getId();
        Long deptId = employeeAssignment.getDepartment().getId();
        Long targetUserId = employeeAssignment.getUser().getId();

        // Validate branch & department consistency
        try {
            authorizationService.validateBranchDepartmentConsistency(branchId, deptId);
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode()).body(Map.of("error", rse.getReason()));
        }

        // Scope check
        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (!branchId.equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير الفرع إنشاء تعيين خارج فرعه"));
            }
        } else if (callerRole == SystemRole.DEPARTMENT_MANAGER) {
            List<Long> managed = authorizationService.getManagedDepartmentIds(callerId);
            if (!managed.contains(deptId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير القسم إنشاء تعيين خارج أقسامه"));
            }
        }

        // Fetch managed entities
        User targetUser = userRepository.findById(targetUserId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "المستخدم غير موجود"));
        Branch branch = branchRepository.findById(branchId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "الفرع غير موجود"));
        Department dept = departmentRepository.findById(deptId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "القسم غير موجود"));

        employeeAssignment.setUser(targetUser);
        employeeAssignment.setBranch(branch);
        employeeAssignment.setDepartment(dept);

        EmployeeAssignment saved = employeeAssignmentRepository.save(employeeAssignment);

        Map<String, Object> meta = new HashMap<>();
        meta.put("userId", targetUser.getId());
        meta.put("department", dept.getName());
        meta.put("branch", branch.getName());
        activityLogService.logAction(callerId, null, EntityType.EMPLOYEE_ASSIGNMENT, saved.getId(),
                ActionType.CREATE, "تم إنشاء تعيين موظف للمستخدم #" + targetUser.getId(), meta);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEmployeeAssignment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody EmployeeAssignment employeeAssignmentDetails) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole == SystemRole.EMPLOYEE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "الموظفون لا يملكون صلاحية تعديل التعيينات"));
        }

        EmployeeAssignment ea = employeeAssignmentRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "التعيين غير موجود"));

        Long newBranchId = employeeAssignmentDetails.getBranch() != null ? employeeAssignmentDetails.getBranch().getId() : ea.getBranch().getId();
        Long newDeptId = employeeAssignmentDetails.getDepartment() != null ? employeeAssignmentDetails.getDepartment().getId() : ea.getDepartment().getId();

        // Validate branch & department consistency
        try {
            authorizationService.validateBranchDepartmentConsistency(newBranchId, newDeptId);
        } catch (ResponseStatusException rse) {
            return ResponseEntity.status(rse.getStatusCode()).body(Map.of("error", rse.getReason()));
        }

        // Scope check
        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (!ea.getBranch().getId().equals(callerBranch) || !newBranchId.equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير الفرع نقل الموظف خارج فرعه"));
            }
        } else if (callerRole == SystemRole.DEPARTMENT_MANAGER) {
            List<Long> managed = authorizationService.getManagedDepartmentIds(callerId);
            if (!managed.contains(ea.getDepartment().getId()) || !managed.contains(newDeptId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير القسم نقل الموظف خارج نطاق أقسامه"));
            }
        }

        if (employeeAssignmentDetails.getBranch() != null) {
            ea.setBranch(branchRepository.findById(newBranchId).orElse(ea.getBranch()));
        }
        if (employeeAssignmentDetails.getDepartment() != null) {
            ea.setDepartment(departmentRepository.findById(newDeptId).orElse(ea.getDepartment()));
        }
        if (employeeAssignmentDetails.getIsPrimary() != null) {
            ea.setIsPrimary(employeeAssignmentDetails.getIsPrimary());
        }
        if (employeeAssignmentDetails.getStartDate() != null) {
            ea.setStartDate(employeeAssignmentDetails.getStartDate());
        }
        if (employeeAssignmentDetails.getEndDate() != null) {
            ea.setEndDate(employeeAssignmentDetails.getEndDate());
        }

        EmployeeAssignment saved = employeeAssignmentRepository.save(ea);

        Map<String, Object> meta = new HashMap<>();
        meta.put("assignmentId", saved.getId());
        activityLogService.logAction(callerId, null, EntityType.EMPLOYEE_ASSIGNMENT, saved.getId(),
                ActionType.UPDATE, "تم تحديث تعيين الموظف #" + ea.getUser().getId(), meta);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployeeAssignment(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole == SystemRole.EMPLOYEE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "الموظفون لا يملكون صلاحية حذف التعيينات"));
        }

        EmployeeAssignment ea = employeeAssignmentRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "التعيين غير موجود"));

        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            if (ea.getBranch() == null || !ea.getBranch().getId().equals(callerBranch)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "غير مصرح لك بحذف تعيين في فرع آخر"));
            }
        } else if (callerRole == SystemRole.DEPARTMENT_MANAGER) {
            List<Long> managed = authorizationService.getManagedDepartmentIds(callerId);
            if (ea.getDepartment() == null || !managed.contains(ea.getDepartment().getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "غير مصرح لك بحذف تعيين في قسم لا تديره"));
            }
        }

        employeeAssignmentRepository.deleteById(id);

        Map<String, Object> meta = new HashMap<>();
        meta.put("assignmentId", id);
        activityLogService.logAction(callerId, null, EntityType.EMPLOYEE_ASSIGNMENT, id,
                ActionType.DELETE, "تم حذف تعيين الموظف #" + (ea.getUser() != null ? ea.getUser().getId() : id), meta);

        return ResponseEntity.ok().build();
    }
}
