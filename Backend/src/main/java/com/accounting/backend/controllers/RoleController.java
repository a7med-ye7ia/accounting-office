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

import com.accounting.backend.entities.Role;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.RoleRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/roles")
public class RoleController {

    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Role> getRoleById(@PathVariable Long id) {
        return roleRepository.findById(id);
    }

    @PostMapping
    public Role createRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Role role) {
        Role saved = roleRepository.save(role);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("roleName", saved.getName());
            activityLogService.logAction(callerId, null, EntityType.ROLE, saved.getId(),
                ActionType.CREATE, "تم إنشاء دور: " + saved.getName(), meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public Role updateRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Role roleDetails) {
        Role role = roleRepository.findById(id).orElseThrow();
        role.setName(roleDetails.getName());
        role.setLevel(roleDetails.getLevel());
        Role saved = roleRepository.save(role);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("roleName", saved.getName());
            activityLogService.logAction(callerId, null, EntityType.ROLE, saved.getId(),
                ActionType.UPDATE, "تم تحديث الدور: " + saved.getName(), meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteRole(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Role role = roleRepository.findById(id).orElse(null);
        if (role == null) return;
        String name = role.getName();
        roleRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("roleName", name);
            activityLogService.logAction(callerId, null, EntityType.ROLE, id,
                ActionType.DELETE, "تم حذف الدور: " + name, meta);
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
