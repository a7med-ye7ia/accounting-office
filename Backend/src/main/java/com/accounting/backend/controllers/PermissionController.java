package com.accounting.backend.controllers;

import com.accounting.backend.entities.Permission;
import com.accounting.backend.repositories.PermissionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/permissions")
public class PermissionController {

    @Autowired
    private PermissionRepository permissionRepository;

    @GetMapping
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Permission> getPermissionById(@PathVariable Long id) {
        return permissionRepository.findById(id);
    }

    @PostMapping
    public Permission createPermission(@RequestBody Permission permission) {
        return permissionRepository.save(permission);
    }

    @PutMapping("/{id}")
    public Permission updatePermission(@PathVariable Long id, @RequestBody Permission permissionDetails) {
        Permission permission = permissionRepository.findById(id).orElseThrow();
        permission.setCode(permissionDetails.getCode());
        permission.setDescription(permissionDetails.getDescription());
        return permissionRepository.save(permission);
    }

    @DeleteMapping("/{id}")
    public void deletePermission(@PathVariable Long id) {
        permissionRepository.deleteById(id);
    }
}