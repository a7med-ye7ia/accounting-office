package com.accounting.backend.controllers;

import com.accounting.backend.entities.PermissionRole;
import com.accounting.backend.entities.PermissionRoleId;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.PermissionRoleRepository;
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
@RequestMapping("/api/permission-roles")
public class PermissionRoleController {

    @Autowired
    private PermissionRoleRepository permissionRoleRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<PermissionRole> getAllPermissionRoles() {
        return permissionRoleRepository.findAll();
    }

    @GetMapping("/{roleId}/{permissionId}")
    public Optional<PermissionRole> getPermissionRoleById(@PathVariable Long roleId, @PathVariable Long permissionId) {
        PermissionRoleId id = new PermissionRoleId(roleId, permissionId);
        return permissionRoleRepository.findById(id);
    }

    @PostMapping
    public PermissionRole createPermissionRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody PermissionRole permissionRole) {
        PermissionRole saved = permissionRoleRepository.save(permissionRole);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("roleId", saved.getId().getRoleId());
            meta.put("permissionId", saved.getId().getPermissionId());
            activityLogService.logAction(callerId, null, EntityType.PERMISSION, saved.getId().getPermissionId(),
                ActionType.CREATE, "تم تعيين صلاحية للدور #" + saved.getId().getRoleId(), meta);
        }
        return saved;
    }

    @DeleteMapping("/{roleId}/{permissionId}")
    public void deletePermissionRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long roleId,
            @PathVariable Long permissionId) {
        PermissionRoleId id = new PermissionRoleId(roleId, permissionId);
        permissionRoleRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("roleId", roleId);
            meta.put("permissionId", permissionId);
            activityLogService.logAction(callerId, null, EntityType.PERMISSION, permissionId,
                ActionType.DELETE, "تم إلغاء صلاحية للدور #" + roleId, meta);
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
