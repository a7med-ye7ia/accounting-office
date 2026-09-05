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

import com.accounting.backend.entities.Permission;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.PermissionRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    private PermissionRepository permissionRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Permission> getPermissionById(@PathVariable Long id) {
        return permissionRepository.findById(id);
    }

    @PostMapping
    public Permission createPermission(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Permission permission) {
        Permission saved = permissionRepository.save(permission);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("permissionCode", saved.getCode());
            activityLogService.logAction(callerId, null, EntityType.PERMISSION, saved.getId(),
                ActionType.CREATE, "تم إنشاء صلاحية: " + saved.getCode(), meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public Permission updatePermission(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Permission permissionDetails) {
        Permission permission = permissionRepository.findById(id).orElseThrow();
        permission.setCode(permissionDetails.getCode());
        permission.setDescription(permissionDetails.getDescription());
        Permission saved = permissionRepository.save(permission);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("permissionCode", saved.getCode());
            activityLogService.logAction(callerId, null, EntityType.PERMISSION, saved.getId(),
                ActionType.UPDATE, "تم تحديث الصلاحية: " + saved.getCode(), meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deletePermission(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Permission permission = permissionRepository.findById(id).orElse(null);
        if (permission == null) return;
        String code = permission.getCode();
        permissionRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("permissionCode", code);
            activityLogService.logAction(callerId, null, EntityType.PERMISSION, id,
                ActionType.DELETE, "تم حذف الصلاحية: " + code, meta);
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
