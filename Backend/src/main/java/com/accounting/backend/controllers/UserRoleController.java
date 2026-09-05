package com.accounting.backend.controllers;

import com.accounting.backend.entities.Role;
import com.accounting.backend.entities.User;
import com.accounting.backend.entities.UserRole;
import com.accounting.backend.entities.UserRoleId;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.enums.SystemRole;
import com.accounting.backend.repositories.RoleRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.repositories.UserRoleRepository;
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
@RequestMapping("/api/user-roles")
public class UserRoleController {

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AuthorizationService authorizationService;

    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<UserRole>> getAllUserRoles(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();
        SystemRole callerRole = authorizationService.getUserRole(callerId);

        if (callerRole == SystemRole.OWNER) {
            return ResponseEntity.ok(userRoleRepository.findAll());
        }

        if (callerRole == SystemRole.BRANCH_MANAGER) {
            Long callerBranch = authorizationService.getUserBranchId(callerId);
            List<UserRole> list = userRoleRepository.findAll().stream()
                    .filter(ur -> !authorizationService.isOwner(ur.getId().getUserId()))
                    .filter(ur -> {
                        Long userBranch = authorizationService.getUserBranchId(ur.getId().getUserId());
                        return userBranch != null && userBranch.equals(callerBranch);
                    })
                    .toList();
            return ResponseEntity.ok(list);
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @GetMapping("/{userId}/{roleId}")
    public ResponseEntity<?> getUserRoleById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long userId,
            @PathVariable Long roleId) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.canViewUser(caller.getId(), userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بعرض أدوار هذا المستخدم"));
        }
        UserRoleId id = new UserRoleId(userId, roleId);
        return userRoleRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createUserRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UserRole userRole) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        if (userRole.getId() == null || userRole.getId().getUserId() == null || userRole.getId().getRoleId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId و roleId حقول مطلوبة"));
        }

        Long targetUserId = userRole.getId().getUserId();
        Long targetRoleId = userRole.getId().getRoleId();

        User targetUser = userRepository.findById(targetUserId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "المستخدم غير موجود"));

        Role targetRoleEntity = roleRepository.findById(targetRoleId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "الدور غير موجود"));

        SystemRole targetRole = SystemRole.fromDbRole(targetRoleEntity.getName());

        // Strictly verify caller can assign this role to target user
        if (!authorizationService.canChangeUserRole(callerId, targetUserId, targetRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بتعيين هذا الدور للمستخدم"));
        }

        userRole.setUser(targetUser);
        userRole.setRole(targetRoleEntity);
        UserRole saved = userRoleRepository.save(userRole);

        Map<String, Object> meta = new HashMap<>();
        meta.put("userId", targetUserId);
        meta.put("roleId", targetRoleId);
        meta.put("roleName", targetRoleEntity.getName());
        activityLogService.logAction(
                callerId, null, EntityType.ROLE, targetRoleId,
                ActionType.CREATE, "تم تعيين دور " + targetRoleEntity.getName() + " للمستخدم #" + targetUserId, meta);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{userId}/{roleId}")
    public ResponseEntity<?> deleteUserRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long userId,
            @PathVariable Long roleId) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        Long callerId = caller.getId();

        Role roleEntity = roleRepository.findById(roleId).orElse(null);
        SystemRole systemRole = roleEntity != null ? SystemRole.fromDbRole(roleEntity.getName()) : null;

        // If removing OWNER role, only Owner can do it
        if (systemRole == SystemRole.OWNER && !authorizationService.isOwner(callerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط المالك يمكنه تعديل دور المالك"));
        }

        if (!authorizationService.canManageUser(callerId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "غير مصرح لك بتعديل أدوار هذا المستخدم"));
        }

        UserRoleId id = new UserRoleId(userId, roleId);
        userRoleRepository.deleteById(id);

        Map<String, Object> meta = new HashMap<>();
        meta.put("userId", userId);
        meta.put("roleId", roleId);
        activityLogService.logAction(
                callerId, null, EntityType.ROLE, roleId,
                ActionType.DELETE, "تم إلغاء دور المستخدم #" + userId, meta);

        return ResponseEntity.ok().build();
    }
}
