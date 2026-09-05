package com.accounting.backend.controllers;

import com.accounting.backend.dto.SubTaskRequest;
import com.accounting.backend.dto.TaskRequest;
import com.accounting.backend.dto.TaskResponse;
import com.accounting.backend.enums.ActionType;
import com.accounting.backend.enums.EntityType;
import com.accounting.backend.security.JwtService;
import com.accounting.backend.services.ActivityLogService;
import com.accounting.backend.services.TaskService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private ActivityLogService activityLogService;

    @GetMapping
    public List<TaskResponse> getAllTasks() {
        return taskService.getAllTasks();
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<?> getTaskByIdLegacy(@PathVariable Long id) {
        return handle(() -> ResponseEntity.ok(taskService.getTaskById(id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable Long id) {
        return handle(() -> ResponseEntity.ok(taskService.getTaskById(id)));
    }

    @PostMapping
    public ResponseEntity<?> createTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody TaskRequest request) {
        return handle(() -> {
            Long callerId = extractUserId(authHeader);
            if (callerId != null) {
                taskService.assertManager(callerId);
            }
            TaskResponse saved = taskService.createTask(request);
            Map<String, Object> meta = new HashMap<>();
            meta.put("taskTitle", saved.getTitle());
            meta.put("assignedTo", saved.getAssignedToName());
            Long actorId = saved.getCreatedById() != null ? saved.getCreatedById() : callerId;
            if (actorId != null) {
                activityLogService.logAction(
                    actorId, null, EntityType.TASK, saved.getId(),
                    ActionType.CREATE, "تم إنشاء مهمة: " + saved.getTitle(), meta);
            }
            return ResponseEntity.ok(saved);
        });
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody TaskRequest request) {
        return handle(() -> {
            Long callerId = extractUserId(authHeader);
            TaskResponse updated = taskService.updateTask(id, request, callerId);
            if (callerId != null) {
                Map<String, Object> meta = new HashMap<>();
                meta.put("taskTitle", updated.getTitle());
                if (updated.getAssignedToName() != null) {
                    meta.put("assignedTo", updated.getAssignedToName());
                }
                activityLogService.logAction(
                    callerId, null, EntityType.TASK, updated.getId(),
                    ActionType.UPDATE, "تم تحديث المهمة: " + updated.getTitle(), meta);
            }
            return ResponseEntity.ok(updated);
        });
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        return handle(() -> {
            Long callerId = extractUserId(authHeader);
            if (callerId != null) {
                taskService.assertManager(callerId);
            }
            TaskResponse existing = null;
            try {
                existing = taskService.getTaskById(id);
            } catch (IllegalArgumentException ignored) {
                return ResponseEntity.ok().build();
            }
            String taskTitle = existing.getTitle();
            taskService.deleteTask(id);
            if (callerId != null) {
                Map<String, Object> meta = new HashMap<>();
                meta.put("taskTitle", taskTitle);
                activityLogService.logAction(
                    callerId, null, EntityType.TASK, id,
                    ActionType.DELETE, "تم حذف المهمة: " + taskTitle, meta);
            }
            return ResponseEntity.ok().build();
        });
    }

    @PostMapping("/{id}/subtasks")
    public ResponseEntity<?> addSubTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @RequestBody SubTaskRequest request) {
        return handle(() -> {
            taskService.assertManager(extractUserId(authHeader));
            return ResponseEntity.ok(taskService.addSubTask(id, request));
        });
    }

    @PutMapping("/{id}/subtasks/{subTaskId}")
    public ResponseEntity<?> updateSubTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @PathVariable Long subTaskId,
            @RequestBody SubTaskRequest request) {
        return handle(() -> {
            taskService.assertManager(extractUserId(authHeader));
            return ResponseEntity.ok(taskService.updateSubTask(id, subTaskId, request));
        });
    }

    @DeleteMapping("/{id}/subtasks/{subTaskId}")
    public ResponseEntity<?> deleteSubTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @PathVariable Long subTaskId) {
        return handle(() -> {
            taskService.assertManager(extractUserId(authHeader));
            return ResponseEntity.ok(taskService.deleteSubTask(id, subTaskId));
        });
    }

    @PostMapping("/{id}/subtasks/{subTaskId}/start")
    public ResponseEntity<?> startSubTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @PathVariable Long subTaskId) {
        return handle(() -> ResponseEntity.ok(
                taskService.startSubTask(id, subTaskId, extractUserId(authHeader))));
    }

    @PostMapping("/{id}/subtasks/{subTaskId}/complete")
    public ResponseEntity<?> completeSubTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @PathVariable Long subTaskId) {
        return handle(() -> ResponseEntity.ok(
                taskService.completeSubTask(id, subTaskId, extractUserId(authHeader))));
    }

    @PostMapping("/{id}/claim")
    public ResponseEntity<?> claimTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        return handle(() -> {
            Long callerId = extractUserId(authHeader);
            if (callerId == null) {
                throw new SecurityException("Unauthorized employee action");
            }
            return ResponseEntity.ok(taskService.claimFreeTask(id, callerId));
        });
    }

    @PostMapping("/{id}/subtasks/{subTaskId}/claim")
    public ResponseEntity<?> claimSubTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id,
            @PathVariable Long subTaskId) {
        return handle(() -> {
            Long callerId = extractUserId(authHeader);
            if (callerId == null) {
                throw new SecurityException("Unauthorized employee action");
            }
            return ResponseEntity.ok(taskService.claimFreeSubTask(id, subTaskId, callerId));
        });
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveTask(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        return handle(() -> {
            Long callerId = extractUserId(authHeader);
            if (callerId == null) {
                throw new SecurityException("Unauthorized employee action");
            }
            return ResponseEntity.ok(taskService.leaveTask(id, callerId));
        });
    }

    @GetMapping("/assignedTo/{userId}")
    public List<TaskResponse> getTasksByUserId(@PathVariable Long userId) {
        return taskService.getTasksByAssignee(userId);
    }

    @GetMapping("/createdBy/{userId}")
    public List<TaskResponse> getTasksByCreatedByUserId(@PathVariable Long userId) {
        return taskService.getTasksByCreator(userId);
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

    private ResponseEntity<?> handle(ControllerAction action) {
        try {
            return action.run();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            HttpStatus status = e.getMessage() != null && e.getMessage().toLowerCase().contains("not found")
                    ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Task cannot be deleted because it is still referenced by related records"));
        }
    }

    @FunctionalInterface
    private interface ControllerAction {
        ResponseEntity<?> run();
    }
}
