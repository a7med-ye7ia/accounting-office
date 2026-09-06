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
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import com.accounting.backend.repositories.RoleRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.AuthorizationService;
import com.accounting.backend.services.EmailService;
import com.accounting.backend.services.EmployeeProfileService;
import com.accounting.backend.services.TokenCacheService;
import org.springframework.web.server.ResponseStatusException;

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

    @Autowired
    private AuthorizationService authorizationService;

    @GetMapping
    @Transactional
    public ResponseEntity<List<Map<String, Object>>> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "branchId", required = false) Long filterBranchId,
            @RequestParam(value = "departmentId", required = false) Long filterDepartmentId) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole role = authorizationService.getUserRole(callerId);

        List<User> users;
        if (role == SystemRole.OWNER) {
            users = userRepository.findAll();
        } else if (role == SystemRole.BRANCH_MANAGER) {
            Long branchId = authorizationService.getUserBranchId(callerId);
            if (branchId == null) {
                users = List.of(caller);
            } else {
                users = userRepository.findAll().stream()
                        .filter(u -> !authorizationService.isOwner(u.getId()) && branchId.equals(authorizationService.getUserBranchId(u.getId())))
                        .toList();
            }
        } else if (role == SystemRole.DEPARTMENT_MANAGER) {
            List<Long> managedDepts = authorizationService.getManagedDepartmentIds(callerId);
            users = userRepository.findAll().stream()
                    .filter(u -> !authorizationService.isOwner(u.getId()) && (u.getId().equals(callerId) || 
                            (authorizationService.getUserDepartmentId(u.getId()) != null && managedDepts.contains(authorizationService.getUserDepartmentId(u.getId())))))
                    .toList();
        } else {
            // EMPLOYEE
            users = List.of(caller);
        }

        if (filterBranchId != null) {
            users = users.stream()
                    .filter(u -> filterBranchId.equals(authorizationService.getUserBranchId(u.getId())))
                    .toList();
        }

        if (filterDepartmentId != null) {
            users = users.stream()
                    .filter(u -> filterDepartmentId.equals(authorizationService.getUserDepartmentId(u.getId())))
                    .toList();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (User user : users) {
            result.add(buildUserMap(user));
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    @Transactional
    public ResponseEntity<?> getUserById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.canViewUser(caller.getId(), id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بعرض بيانات هذا المستخدم"));
        }
        return userRepository.findById(id)
                .map(user -> ResponseEntity.ok(buildUserMap(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/profile")
    @Transactional
    public ResponseEntity<?> getEmployeeProfile(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.canViewUser(caller.getId(), id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بعرض هذا الملف التعريفي"));
        }
        return employeeProfileService.getProfile(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/users
     * Creates a new user. Restricted by role and organizational scope.
     * - OWNER: global
     * - BRANCH_MANAGER: within own branch only (cannot grant OWNER role)
     * - DEPARTMENT_MANAGER: within managed departments with EMPLOYEE role
     * - EMPLOYEE: forbidden
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createUser(
            @RequestHeader(value = "Authorization") String authHeader,
            @RequestBody EmployeeCreationRequest request) {

        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole == SystemRole.EMPLOYEE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "الموظفون لا يملكون صلاحية إنشاء مستخدمين جدد"));
        }

        // Scope validation
        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranchId = authorizationService.getUserBranchId(callerId);
            if (callerBranchId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "مدير الفرع غير مسند إلى أي فرع"));
            }
            if (request.getBranchId() != null && !callerBranchId.equals(request.getBranchId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير الفرع إنشاء موظف خارج فرعه"));
            }
            request.setBranchId(callerBranchId); // force own branch

            if (request.getRoleId() != null) {
                Role targetRole = roleRepository.findById(request.getRoleId()).orElse(null);
                if (targetRole != null && SystemRole.fromDbRole(targetRole.getName()) == SystemRole.OWNER) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "لا يمكن لمدير الفرع منح دور المالك (OWNER)"));
                }
            }
        } else if (callerRole == SystemRole.DEPARTMENT_MANAGER) {
            List<Long> managedDepts = authorizationService.getManagedDepartmentIds(callerId);
            if (request.getDepartmentId() == null || !managedDepts.contains(request.getDepartmentId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "لا يمكن لمدير القسم إنشاء موظف خارج الأقسام التي يديرها"));
            }
            if (request.getRoleId() != null) {
                Role targetRole = roleRepository.findById(request.getRoleId()).orElse(null);
                if (targetRole != null && SystemRole.fromDbRole(targetRole.getName()) != SystemRole.EMPLOYEE) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "يمكن لمدير القسم إنشاء موظفين فقط"));
                }
            }
        }

        // Validate branch & department consistency
        if (request.getBranchId() != null && request.getDepartmentId() != null) {
            try {
                authorizationService.validateBranchDepartmentConsistency(request.getBranchId(), request.getDepartmentId());
            } catch (ResponseStatusException rse) {
                return ResponseEntity.status(rse.getStatusCode()).body(Map.of("error", rse.getReason()));
            }
        }

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

    @PutMapping("/me")
    @Transactional
    public ResponseEntity<?> updateOwnProfile(
            @RequestHeader(value = "Authorization") String authHeader,
            @RequestBody Map<String, Object> body) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (body.containsKey("fullName") && body.get("fullName") != null) {
            String name = body.get("fullName").toString().trim();
            if (!name.isBlank()) {
                caller.setFullName(name);
            }
        }
        if (body.containsKey("phone") && body.get("phone") != null) {
            caller.setPhone(body.get("phone").toString().trim());
        }
        caller.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(caller);

        Map<String, Object> meta = new HashMap<>();
        meta.put("userName", savedUser.getFullName());
        activityLogService.logAction(
            caller.getId(), null, EntityType.USER, savedUser.getId(),
            ActionType.UPDATE, "قام المستخدم بتحديث ملفه الشخصي: " + savedUser.getFullName(), meta);

        return ResponseEntity.ok(buildUserMap(savedUser));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateUser(
            @RequestHeader(value = "Authorization") String authHeader,
            @PathVariable Long id,
            @RequestBody EmployeeCreationRequest request) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        boolean isSelf = callerId.equals(id);

        User user = userRepository.findById(id).orElseThrow(() -> 
                new ResponseStatusException(HttpStatus.NOT_FOUND, "المستخدم غير موجود"));

        // If editing someone else, verify management permission
        if (!isSelf) {
            if (!authorizationService.canManageUser(callerId, id)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "غير مصرح لك بتعديل هذا المستخدم"));
            }
        }

        String oldName = user.getFullName();
        String oldEmail = user.getEmail();
        String oldPhone = user.getPhone();
        String oldNationalId = user.getNationalId();
        String oldStatus = user.getStatus() != null ? user.getStatus().name() : null;
        LocalDate oldHireDate = user.getHireDate();

        // Self-edit is restricted to personal profile data only
        if (isSelf) {
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                user.setFullName(request.getFullName());
            }
            if (request.getPhone() != null) {
                user.setPhone(request.getPhone());
            }
            // Cannot change role, branch, dept, status, nationalId, hireDate, email
        } else {
            // Manager editing user
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                user.setFullName(request.getFullName());
            }
            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                user.setEmail(request.getEmail());
            }
            if (request.getPhone() != null) {
                user.setPhone(request.getPhone());
            }
            if (request.getNationalId() != null) {
                user.setNationalId(request.getNationalId());
            }
            if (request.getStatus() != null) {
                user.setStatus(UserStatus.valueOf(request.getStatus()));
            }
            if (request.getHireDate() != null) {
                user.setHireDate(request.getHireDate());
            }
        }

        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        // Update EmployeeAssignment (forbidden for self-edit)
        String oldDeptName = null;
        String oldBranchName = null;
        if (!isSelf && request.getDepartmentId() != null && request.getBranchId() != null) {
            try {
                authorizationService.validateBranchDepartmentConsistency(request.getBranchId(), request.getDepartmentId());
            } catch (ResponseStatusException rse) {
                return ResponseEntity.status(rse.getStatusCode()).body(Map.of("error", rse.getReason()));
            }

            SystemRole callerRole = authorizationService.getUserRole(callerId);
            if (callerRole == SystemRole.BRANCH_MANAGER) {
                Long callerBranch = authorizationService.getUserBranchId(callerId);
                if (!request.getBranchId().equals(callerBranch)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "لا يمكن لمدير الفرع نقل الموظف إلى فرع آخر"));
                }
            } else if (callerRole == SystemRole.DEPARTMENT_MANAGER) {
                List<Long> managed = authorizationService.getManagedDepartmentIds(callerId);
                if (!managed.contains(request.getDepartmentId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "لا يمكن لمدير القسم نقل الموظف خارج نطاق الأقسام التي يديرها"));
                }
            }

            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("القسم غير موجود"));
            Branch branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new RuntimeException("الفرع غير موجود"));

            List<EmployeeAssignment> existing = employeeAssignmentRepository.findByUser_Id(id);
            EmployeeAssignment assignment;
            if (!existing.isEmpty()) {
                assignment = existing.get(0);
                oldDeptName = assignment.getDepartment() != null ? assignment.getDepartment().getName() : null;
                oldBranchName = assignment.getBranch() != null ? assignment.getBranch().getName() : null;
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

        // Update UserRole (forbidden for self-edit)
        String oldRoleName = null;
        if (!isSelf && request.getRoleId() != null) {
            Role role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new RuntimeException("المسمى الوظيفي غير موجود"));
            SystemRole targetRole = SystemRole.fromDbRole(role.getName());

            if (!authorizationService.canChangeUserRole(callerId, id, targetRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "غير مصرح لك بتعيين هذا الدور للمستخدم"));
            }

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
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        if (!authorizationService.canManageUser(callerId, id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بحذف هذا المستخدم"));
        }

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

        boolean isOwner = authorizationService.isOwner(callerId);

        if (!isOwner) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only users with the 'owner' role can perform this operation"));
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
            if (primary.getDepartment() != null) {
                userData.put("departmentId", primary.getDepartment().getId());
                userData.put("departmentName", primary.getDepartment().getName());
            }
            if (primary.getBranch() != null) {
                userData.put("branchId", primary.getBranch().getId());
                userData.put("branchName", primary.getBranch().getName());
            }
        }

        // Get role from UserRole
        List<UserRole> userRoles = userRoleRepository.findByUser_Id(user.getId());
        if (!userRoles.isEmpty() && userRoles.get(0).getRole() != null) {
            userData.put("roleId", userRoles.get(0).getRole().getId());
            userData.put("roleName", userRoles.get(0).getRole().getName());
        }

        SystemRole canonicalRole = authorizationService.getUserRole(user.getId());
        userData.put("canonicalRole", canonicalRole.name());
        if (canonicalRole == SystemRole.DEPARTMENT_MANAGER) {
            userData.put("managedDepartmentIds", authorizationService.getManagedDepartmentIds(user.getId()));
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