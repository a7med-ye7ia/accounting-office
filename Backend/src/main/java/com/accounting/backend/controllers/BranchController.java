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

import com.accounting.backend.entities.Branch;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/branches")
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Branch> getBranchById(@PathVariable Long id) {
        return branchRepository.findById(id);
    }

    @PostMapping
    public Branch createBranch(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Branch branch) {
        Branch saved = branchRepository.save(branch);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("branchName", saved.getName());
            activityLogService.logAction(callerId, null, EntityType.BRANCH, saved.getId(),
                ActionType.CREATE, "تم إنشاء فرع: " + saved.getName(), meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public Branch updateBranch(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Branch branchDetails) {
        Branch branch = branchRepository.findById(id).orElseThrow();
        branch.setName(branchDetails.getName());
        branch.setAddress(branchDetails.getAddress());
        branch.setPhone(branchDetails.getPhone());
        Branch saved = branchRepository.save(branch);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("branchName", saved.getName());
            activityLogService.logAction(callerId, null, EntityType.BRANCH, saved.getId(),
                ActionType.UPDATE, "تم تحديث الفرع: " + saved.getName(), meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteBranch(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        Branch branch = branchRepository.findById(id).orElse(null);
        if (branch == null) return;
        String name = branch.getName();
        branchRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("branchName", name);
            activityLogService.logAction(callerId, null, EntityType.BRANCH, id,
                ActionType.DELETE, "تم حذف الفرع: " + name, meta);
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
