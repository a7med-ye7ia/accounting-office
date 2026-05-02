package com.accounting.backend.controllers;

import com.accounting.backend.entities.UserRole;
import com.accounting.backend.entities.UserRoleId;
import com.accounting.backend.repositories.UserRoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/user-roles")
public class UserRoleController {

    @Autowired
    private UserRoleRepository userRoleRepository;

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
    public UserRole createUserRole(@RequestBody UserRole userRole) {
        return userRoleRepository.save(userRole);
    }

    @DeleteMapping("/{userId}/{roleId}")
    public void deleteUserRole(@PathVariable Long userId, @PathVariable Long roleId) {
        UserRoleId id = new UserRoleId(userId, roleId);
        userRoleRepository.deleteById(id);
    }
}