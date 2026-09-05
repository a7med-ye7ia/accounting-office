package com.accounting.backend.controllers;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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

import com.accounting.backend.dtos.EmployeeCreationRequest;
import com.accounting.backend.entities.Branch;
import com.accounting.backend.entities.Department;
import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.entities.Role;
import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.entities.UserRoleId;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import com.accounting.backend.repositories.RoleRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.EmailService;
import com.accounting.backend.services.EmployeeProfileService;
import com.accounting.backend.services.TokenCacheService;

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
    @Autowired
    private EmailService emailService;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private TokenCacheService tokenCacheService;
    @Autowired
    private ActivityLogService activityLogService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom secureRandom = new SecureRandom();

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

    /**
     * POST /api/users
     * Creates a new user. ONLY accessible by users with the "owner" role.
     *
     * - Generates a random 8-digit temporary password.
     * - Sets the new user's status to PENDING_VERIFICATION (blocked from system
     * actions).
     * - Sends the temporary password to the new user's email.
     * - The new user must call POST /api/auth/change-password to activate their
     * account.
     *
     * @param authHeader Authorization: Bearer <token> of the caller (must be owner)
     * @param request    the new user's details
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createUser(
            @RequestHeader(value = "Authorization") String authHeader,
            @RequestBody EmployeeCreationRequest request) {

        // ── 0. validate fields ──────────────────────────────────────────────
        List<String> errors = checkExist(request);
        if (!errors.isEmpty()) {
            StringBuilder errorsString = new StringBuilder();
            errorsString.append("The following fields already exist: ");
            for (int i = 0; i < errors.size(); i++) {
                errorsString.append(errors.get(i));
                if (i < errors.size() - 1) {
                    errorsString.append(", ");
                }
            }
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", errorsString.toString()));
        }

        // ── 1. Owner-only guard ──────────────────────────────────────────────
        ResponseEntity<?> authError = requireOwnerRole(authHeader);
        if (authError != null) {
            return authError;
        }

        Long callerId = extractUserId(authHeader);

        // ── 2. Build user ────────────────────────────────────────────────────
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setNationalId(request.getNationalId());
        user.setHireDate(request.getHireDate());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // ── 3. Generate random 8-digit temporary password ────────────────────
        String tempPassword = generateTempPassword();
        user.setPassword(passwordEncoder.encode(tempPassword));

        // ── 4. New user is PENDING_VERIFICATION until they change their password
        user.setStatus(UserStatus.PENDING_VERIFICATION);

        // Allow overriding status explicitly (e.g., for owner themselves)
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            user.setStatus(UserStatus.valueOf(request.getStatus()));
        }
        // ── 7. Send temporary password email ─────────────────────────────────
        try {
            User savedUser = userRepository.save(user);
            // ── 5. Create EmployeeAssignment if department and branch are provided ─
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

            // ── 6. Create UserRole if roleId is provided ─────────────────────────
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
            Map<String, Object> response = buildUserMap(savedUser);
            response.put("message", "User created. A temporary password has been sent to " + savedUser.getEmail());
            emailService.sendTemporaryPasswordEmail(request.getEmail(), request.getFullName(), tempPassword);

            Map<String, Object> meta = new HashMap<>();
            meta.put("userName", savedUser.getFullName());
            meta.put("userEmail", savedUser.getEmail());
            if (request.getRoleId() != null) {
                roleRepository.findById(request.getRoleId())
                    .ifPresent(r -> meta.put("role", r.getName()));
            }
            activityLogService.logAction(
                callerId, null, EntityType.USER, savedUser.getId(),
                ActionType.CREATE, "تم إنشاء مستخدم جديد: " + savedUser.getFullName(), meta);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to create user", "details", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateUser(
            @RequestHeader(value = "Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody EmployeeCreationRequest request) {
        Long callerId = extractUserId(authHeader);
        User user = userRepository.findById(id).orElseThrow();

        String oldName = user.getFullName();
        String oldEmail = user.getEmail();
        String oldPhone = user.getPhone();
        String oldNationalId = user.getNationalId();
        String oldStatus = user.getStatus() != null ? user.getStatus().name() : null;
        LocalDate oldHireDate = user.getHireDate();

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
        String oldDeptName = null;
        String oldBranchName = null;
        if (request.getDepartmentId() != null && request.getBranchId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("القسم غير موجود"));
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new RuntimeException("الفرع غير موجود"));

            List<EmployeeAssignment> existing = employeeAssignmentRepository.findByUser_Id(id);
            EmployeeAssignment assignment;
            if (!existing.isEmpty()) {
                assignment = existing.get(0);
                oldDeptName = assignment.getDepartment().getName();
                oldBranchName = assignment.getBranch().getName();
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
        String oldRoleName = null;
        if (request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("المسمى الوظيفي غير موجود"));

            List<UserRole> existingRoles = userRoleRepository.findByUser_Id(id);
            if (!existingRoles.isEmpty()) {
                oldRoleName = existingRoles.get(0).getRole().getName();
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

        List<Map<String, String>> changes = new ArrayList<>();
        addChange(changes, "الاسم", oldName, savedUser.getFullName());
        addChange(changes, "البريد الإلكتروني", oldEmail, savedUser.getEmail());
        addChange(changes, "رقم الهاتف", oldPhone, savedUser.getPhone());
        addChange(changes, "الرقم القومي", oldNationalId, savedUser.getNationalId());
        addChange(changes, "الحالة", oldStatus, savedUser.getStatus() != null ? savedUser.getStatus().name() : null);
        addChange(changes, "تاريخ التعيين", oldHireDate != null ? oldHireDate.toString() : null,
                savedUser.getHireDate() != null ? savedUser.getHireDate().toString() : null);
        addChange(changes, "القسم", oldDeptName, request.getDepartmentId() != null
                ? departmentRepository.findById(request.getDepartmentId()).map(Department::getName).orElse(null) : null);
        addChange(changes, "الفرع", oldBranchName, request.getBranchId() != null
                ? branchRepository.findById(request.getBranchId()).map(Branch::getName).orElse(null) : null);
        addChange(changes, "المسمى الوظيفي", oldRoleName, request.getRoleId() != null
                ? roleRepository.findById(request.getRoleId()).map(Role::getName).orElse(null) : null);

        Map<String, Object> meta = new HashMap<>();
        meta.put("userName", savedUser.getFullName());
        meta.put("changes", changes);
        activityLogService.logAction(
            callerId, null, EntityType.USER, savedUser.getId(),
            ActionType.UPDATE, "تم تحديث المستخدم: " + savedUser.getFullName(), meta);

        return ResponseEntity.ok(buildUserMap(savedUser));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(
            @RequestHeader(value = "Authorization") String authHeader,
            @PathVariable Long id) {
        Long callerId = extractUserId(authHeader);
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        String userName = user.getFullName();
        employeeAssignmentRepository.deleteByUser_Id(id);
        userRoleRepository.deleteByUser_Id(id);
        userRepository.deleteById(id);

        Map<String, Object> meta = new HashMap<>();
        meta.put("userName", userName);
        activityLogService.logAction(
            callerId, null, EntityType.USER, id,
            ActionType.DELETE, "تم حذف المستخدم: " + userName, meta);

        return ResponseEntity.ok().build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7).trim();
        return jwtService.extractUserId(token);
    }

    /**
     * Checks that the request comes from an authenticated user with the "owner"
     * role.
     * Returns a 401/403 ResponseEntity if the check fails, or null if OK.
     */
    private ResponseEntity<?> requireOwnerRole(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Authentication required"));
        }

        String token = authHeader.substring(7).trim();

        if (!jwtService.isTokenValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired token"));
        }

        Long callerId;
        try {
            callerId = jwtService.extractUserId(token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Could not read token claims"));
        }

        if (!tokenCacheService.isTokenValid(callerId, token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Session expired. Please log in again."));
        }

        Optional<User> callerOpt = userRepository.findById(callerId);
        if (callerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Caller user not found"));
        }

        boolean isOwner = userRoleRepository.findByUser_Id(callerId).stream()
                .anyMatch(ur -> "owner".equalsIgnoreCase(ur.getRole().getName()));

        if (!isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only users with the 'owner' role can create new users"));
        }

        return null; // all checks passed
    }

    /**
     * Generates a random 8-digit numeric temporary password using SecureRandom.
     * Example: "04729381"
     */
    private String generateTempPassword() {
        int digits = 8;
        StringBuilder sb = new StringBuilder(digits);
        for (int i = 0; i < digits; i++) {
            sb.append(secureRandom.nextInt(10)); // 0-9
        }
        return sb.toString();
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

    private List<String> checkExist(EmployeeCreationRequest request) {
        List<String> exists = new ArrayList<>();
        Optional<User> emailCheck = userRepository.findByEmail(request.getEmail());
        if (emailCheck.isPresent()) {
            exists.add("Email already exists");
        }
        
        Optional<User> nationalIdCheck = userRepository.findByNationalId(request.getNationalId());
        if (nationalIdCheck.isPresent()) {
            exists.add("National ID already exists");
        }

        Optional<User> phoneCheck = userRepository.findByPhone(request.getPhone());
        if (phoneCheck.isPresent()) {
            exists.add("Phone number already exists");
        }

        return exists;
    }

    private void addChange(List<Map<String, String>> changes, String field, String oldVal, String newVal) {
        if (oldVal == null && newVal == null) return;
        if (oldVal != null && oldVal.equals(newVal)) return;
        Map<String, String> entry = new HashMap<>();
        entry.put("field", field);
        entry.put("old", oldVal != null ? oldVal : "");
        entry.put("new", newVal != null ? newVal : "");
        changes.add(entry);
    }
}