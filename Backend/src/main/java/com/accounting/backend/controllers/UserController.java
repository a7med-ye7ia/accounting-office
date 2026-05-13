package com.accounting.backend.controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.dtos.EmployeeCreationRequest;
import com.accounting.backend.entities.Branch;
import com.accounting.backend.entities.Department;
import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.entities.Role;
import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.entities.UserRoleId;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import com.accounting.backend.repositories.RoleRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;
import com.accounting.backend.services.EmployeeProfileService;

import jakarta.transaction.Transactional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private BranchRepository branchRepository;
    @Autowired
    private EmployeeAssignmentRepository employeeAssignmentRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private EmployeeProfileService employeeProfileService;

    @GetMapping
    @Transactional
    public List<Map<String, Object>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (User user : users) {
            result.add(buildUserMap(user));
        }
        return result;
    }

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(buildUserMap(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/profile")
    @Transactional
    public ResponseEntity<Map<String, Object>> getEmployeeProfile(@PathVariable Long id) {
        return employeeProfileService.getProfile(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createUser(@RequestBody EmployeeCreationRequest request) {

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setNationalId(request.getNationalId());
        user.setPassword(request.getPassword() != null ? request.getPassword() : "123456");
        user.setHireDate(request.getHireDate());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        if (request.getStatus() != null) {
            user.setStatus(UserStatus.valueOf(request.getStatus()));
        }

        User savedUser = userRepository.save(user);

        // Create EmployeeAssignment if department and branch are provided
        if (request.getDepartmentId() != null && request.getBranchId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("القسم غير موجود"));
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new RuntimeException("الفرع غير موجود"));

            EmployeeAssignment assignment = new EmployeeAssignment();
            assignment.setUser(savedUser);
            assignment.setDepartment(dept);
            assignment.setBranch(branch);
            assignment.setIsPrimary(true);
            assignment.setStartDate(request.getHireDate() != null ? request.getHireDate() : LocalDate.now());
            employeeAssignmentRepository.save(assignment);
        }

        // Create UserRole if roleId is provided
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("المسمى الوظيفي غير موجود"));
            UserRole userRole = new UserRole();
            UserRoleId userRoleId = new UserRoleId(savedUser.getId(), role.getId());
            userRole.setId(userRoleId);
            userRole.setUser(savedUser);
            userRole.setRole(role);
            userRoleRepository.save(userRole);
        }

        return ResponseEntity.ok(buildUserMap(savedUser));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody EmployeeCreationRequest request) {
        User user = userRepository.findById(id).orElseThrow();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        if (request.getNationalId() != null) {
            user.setNationalId(request.getNationalId());
        }
        if (request.getStatus() != null) {
            user.setStatus(UserStatus.valueOf(request.getStatus()));
        }
        user.setHireDate(request.getHireDate());
        user.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Update EmployeeAssignment
        if (request.getDepartmentId() != null && request.getBranchId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("القسم غير موجود"));
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new RuntimeException("الفرع غير موجود"));

            List<EmployeeAssignment> existing = employeeAssignmentRepository.findByUser_Id(id);
            EmployeeAssignment assignment;
            if (!existing.isEmpty()) {
                assignment = existing.get(0);
            } else {
                assignment = new EmployeeAssignment();
                assignment.setUser(savedUser);
                assignment.setIsPrimary(true);
                assignment.setStartDate(request.getHireDate() != null ? request.getHireDate() : LocalDate.now());
            }
            assignment.setDepartment(dept);
            assignment.setBranch(branch);
            employeeAssignmentRepository.save(assignment);
        }

        // Update UserRole
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("المسمى الوظيفي غير موجود"));

            List<UserRole> existingRoles = userRoleRepository.findByUser_Id(id);
            if (!existingRoles.isEmpty()) {
                userRoleRepository.deleteAll(existingRoles);
                userRoleRepository.flush();
            }

            UserRole userRole = new UserRole();
            UserRoleId userRoleId = new UserRoleId(savedUser.getId(), role.getId());
            userRole.setId(userRoleId);
            userRole.setUser(savedUser);
            userRole.setRole(role);
            userRoleRepository.save(userRole);
        }

        return ResponseEntity.ok(buildUserMap(savedUser));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        employeeAssignmentRepository.deleteByUser_Id(id);
        userRoleRepository.deleteByUser_Id(id);
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Builds a Map with all user data including role and department info
     * from the related EmployeeAssignment and UserRole tables.
     */
    private Map<String, Object> buildUserMap(User user) {
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("fullName", user.getFullName());
        userData.put("email", user.getEmail());
        userData.put("phone", user.getPhone());
        userData.put("nationalId", user.getNationalId());
        userData.put("status", user.getStatus());
        userData.put("hireDate", user.getHireDate());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("updatedAt", user.getUpdatedAt());

        // Get department + branch from EmployeeAssignment
        List<EmployeeAssignment> assignments = employeeAssignmentRepository.findByUser_Id(user.getId());
        if (!assignments.isEmpty()) {
            EmployeeAssignment primary = assignments.stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsPrimary()))
                    .findFirst()
                    .orElse(assignments.get(0));
            userData.put("departmentId", primary.getDepartment().getId());
            userData.put("departmentName", primary.getDepartment().getName());
            userData.put("branchId", primary.getBranch().getId());
            userData.put("branchName", primary.getBranch().getName());
        }

        // Get role from UserRole
        List<UserRole> userRoles = userRoleRepository.findByUser_Id(user.getId());
        if (!userRoles.isEmpty()) {
            userData.put("roleId", userRoles.get(0).getRole().getId());
            userData.put("roleName", userRoles.get(0).getRole().getName());
        }

        return userData;
    }
}