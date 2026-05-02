package com.accounting.backend.controllers;

import com.accounting.backend.entities.PermissionRole;
import com.accounting.backend.entities.PermissionRoleId;
import com.accounting.backend.repositories.PermissionRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/permission-roles")
public class PermissionRoleController {

    @Autowired
    private PermissionRoleRepository permissionRoleRepository;

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
    public PermissionRole createPermissionRole(@RequestBody PermissionRole permissionRole) {
        return permissionRoleRepository.save(permissionRole);
    }

    @DeleteMapping("/{roleId}/{permissionId}")
    public void deletePermissionRole(@PathVariable Long roleId, @PathVariable Long permissionId) {
        PermissionRoleId id = new PermissionRoleId(roleId, permissionId);
        permissionRoleRepository.deleteById(id);
    }
}