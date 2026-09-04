package com.accounting.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import org.springframework.web.server.ResponseStatusException;

import com.accounting.backend.entities.Branch;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.AuthorizationService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/branches")
public class BranchController {

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private AuthorizationService authorizationService;

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
    public ResponseEntity<?> createBranch(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Branch branch) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.isOwner(caller.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط المالك (Owner) يمكنه إنشاء فروع جديدة"));
        }

        Branch saved = branchRepository.save(branch);
        Map<String, Object> meta = new HashMap<>();
        meta.put("branchName", saved.getName());
        activityLogService.logAction(caller.getId(), null, EntityType.BRANCH, saved.getId(),
            ActionType.CREATE, "تم إنشاء فرع: " + saved.getName(), meta);

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBranch(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody Branch branchDetails) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.isOwner(caller.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط المالك (Owner) يمكنه تعديل بيانات الفروع"));
        }

        Branch branch = branchRepository.findById(id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "الفرع غير موجود"));

        branch.setName(branchDetails.getName());
        branch.setAddress(branchDetails.getAddress());
        branch.setPhone(branchDetails.getPhone());
        Branch saved = branchRepository.save(branch);

        Map<String, Object> meta = new HashMap<>();
        meta.put("branchName", saved.getName());
        activityLogService.logAction(caller.getId(), null, EntityType.BRANCH, saved.getId(),
            ActionType.UPDATE, "تم تحديث الفرع: " + saved.getName(), meta);

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBranch(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        User caller = authorizationService.requireAuthenticatedUser(authHeader);
        if (!authorizationService.isOwner(caller.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "فقط المالك (Owner) يمكنه حذف الفروع"));
        }

        Branch branch = branchRepository.findById(id).orElse(null);
        if (branch == null) {
            return ResponseEntity.notFound().build();
        }
        String name = branch.getName();
        branchRepository.deleteById(id);

        Map<String, Object> meta = new HashMap<>();
        meta.put("branchName", name);
        activityLogService.logAction(caller.getId(), null, EntityType.BRANCH, id,
            ActionType.DELETE, "تم حذف الفرع: " + name, meta);

        return ResponseEntity.ok().build();
    }
}
