package com.accounting.backend.controllers;

import com.accounting.backend.dto.TaskRequest;
import com.accounting.backend.dto.TaskResponse;
import com.accounting.backend.entities.Task;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.TaskRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.services.NotificationService;
import com.accounting.backend.enums.NotificationType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public List<TaskResponse> getAllTasks() {
        // return taskRepository.findAll();
        return taskRepository.findAll()
            .stream()
            .map(TaskResponse::mapToResponse)
            .toList();
    }

    @GetMapping("/tasks/{id}")
    public TaskResponse getTaskById(@PathVariable Long id) {
        Task task = taskRepository.findById(id).orElseThrow();
        return TaskResponse.mapToResponse(task);
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody TaskRequest request) {

        User assignedUser = userRepository.findById(request.getAssignedToId())
            .orElseThrow(() -> new RuntimeException("Assigned user not found"));

        User createdByUser = userRepository.findById(request.getCreatedById())
            .orElseThrow(() -> new RuntimeException("Creator user not found"));

        // Block unverified users from taking or creating tasks
        if (assignedUser.getStatus() == UserStatus.PENDING_VERIFICATION) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "User '" + assignedUser.getFullName() + "' has not verified their account yet. " +
                          "They must change their temporary password before tasks can be assigned to them."
            ));
        }
        if (createdByUser.getStatus() == UserStatus.PENDING_VERIFICATION) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Your account is not yet verified. Please change your temporary password first."
            ));
        }

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setDueDate(request.getDueDate());
        task.setCreatedAt(LocalDateTime.now());
        task.setAssignedTo(assignedUser);
        task.setCreatedBy(createdByUser);

        Task saved = taskRepository.save(task);

        String message = String.format("You have been assigned a new task: %s", task.getTitle());
        notificationService.createNotification(assignedUser.getId(), "New task",
                             message, NotificationType.TASK_ASSIGNED, saved.getId());

        return ResponseEntity.ok(TaskResponse.mapToResponse(saved));
    }

    @PutMapping("/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @RequestBody TaskRequest request) {

        Task task = taskRepository.findById(id).orElseThrow();

        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }

        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }

        if (request.getAssignedToId() != null) {
            User user = userRepository.findById(request.getAssignedToId()).orElseThrow();
            task.setAssignedTo(user);
        }

        if (request.getCreatedById() != null) {
            User user = userRepository.findById(request.getCreatedById()).orElseThrow();
            task.setCreatedBy(user);
        }

        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }

        Task updated = taskRepository.save(task);

        return TaskResponse.mapToResponse(updated);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        // TODO : handle the delete logic (soft delete)
        taskRepository.deleteById(id);
    }

    @GetMapping("/assignedTo/{userId}")
    public List<TaskResponse> getTasksByUserId(@PathVariable Long userId) {
        return taskRepository.findByAssignedTo_Id(userId)
            .stream()
            .map(TaskResponse::mapToResponse)
            .toList();
    }
}