package com.accounting.backend.controllers;

import com.accounting.backend.entities.TaskApproval;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.repositories.TaskApprovalRepository;
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
@RequestMapping("/api/task-approvals")
public class TaskApprovalController {

    @Autowired
    private TaskApprovalRepository taskApprovalRepository;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<TaskApproval> getAllTaskApprovals() {
        return taskApprovalRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<TaskApproval> getTaskApprovalById(@PathVariable Long id) {
        return taskApprovalRepository.findById(id);
    }

    @PostMapping
    public TaskApproval createTaskApproval(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody TaskApproval taskApproval) {
        TaskApproval saved = taskApprovalRepository.save(taskApproval);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getTask() != null) meta.put("taskId", saved.getTask().getId());
            if (saved.getStatus() != null) meta.put("status", saved.getStatus().name());
            activityLogService.logAction(callerId, null, EntityType.TASK_APPROVAL, saved.getId(),
                ActionType.CREATE, "تم إنشاء موافقة مهمة", meta);
        }
        return saved;
    }

    @PutMapping("/{id}")
    public TaskApproval updateTaskApproval(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody TaskApproval taskApprovalDetails) {
        TaskApproval taskApproval = taskApprovalRepository.findById(id).orElseThrow();
        taskApproval.setTask(taskApprovalDetails.getTask());
        taskApproval.setApprovedBy(taskApprovalDetails.getApprovedBy());
        taskApproval.setStatus(taskApprovalDetails.getStatus());
        taskApproval.setComment(taskApprovalDetails.getComment());
        taskApproval.setApprovedAt(taskApprovalDetails.getApprovedAt());
        TaskApproval saved = taskApprovalRepository.save(taskApproval);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            if (saved.getStatus() != null) meta.put("status", saved.getStatus().name());
            activityLogService.logAction(callerId, null, EntityType.TASK_APPROVAL, saved.getId(),
                ActionType.UPDATE, "تم تحديث موافقة المهمة", meta);
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public void deleteTaskApproval(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        taskApprovalRepository.deleteById(id);
        Long callerId = extractUserId(authHeader);
        if (callerId != null) {
            Map<String, Object> meta = new HashMap<>();
            meta.put("approvalId", id);
            activityLogService.logAction(callerId, null, EntityType.TASK_APPROVAL, id,
                ActionType.DELETE, "تم حذف موافقة المهمة", meta);
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
