package com.accounting.backend.controllers;

import com.accounting.backend.entities.UserRole;
import com.accounting.backend.entities.UserRoleId;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.UserRoleRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/user-roles")
public class UserRoleController {

    @Autowired
    private UserRoleRepository userRoleRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<UserRole> getAllUserRoles() {
        return userRoleRepository.findAll();
    }

    @GetMapping("/{userId}/{roleId}")
    public Optional<UserRole> getUserRoleById(@PathVariable Long userId, @PathVariable Long roleId) {
        UserRoleId id = new UserRoleId(userId, roleId);
        return userRoleRepository.findById(id);
    }

    @PostMapping
    public UserRole createUserRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody UserRole userRole) {
        UserRole saved = userRoleRepository.save(userRole);

        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("userId", saved.getId().getUserId());
            meta.put("roleId", saved.getId().getRoleId());
            activityLogService.logAction(
                callerId, null, EntityType.ROLE, saved.getId().getRoleId(),
                ActionType.CREATE, "تم تعيين دور للمستخدم #" + saved.getId().getUserId(), meta);
        }

        return saved;
    }

    @DeleteMapping("/{userId}/{roleId}")
    public void deleteUserRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long userId,
            @PathVariable Long roleId) {
        UserRoleId id = new UserRoleId(userId, roleId);
        userRoleRepository.deleteById(id);

        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("userId", userId);
            meta.put("roleId", roleId);
            activityLogService.logAction(
                callerId, null, EntityType.ROLE, roleId,
                ActionType.DELETE, "تم إلغاء دور المستخدم #" + userId, meta);
        }
    }

    private Long extractUserId(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        try {
            String token = authHeader.substring(7).trim();
            return jwtService.extractUserId(token);
        } catch (Exception e) {
            return null;
        }
    }
}
