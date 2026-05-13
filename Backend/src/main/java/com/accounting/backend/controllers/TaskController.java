package com.accounting.backend.controllers;

import com.accounting.backend.dto.TaskRequest;
import com.accounting.backend.dto.TaskResponse;
import com.accounting.backend.dto.TaskResponse;
import com.accounting.backend.entities.Task;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.TaskStatus;
import com.accounting.backend.repositories.TaskRepository;
import com.accounting.backend.repositories.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<TaskResponse> getAllTasks() {
        // return taskRepository.findAll();
        return taskRepository.findAll()
            .stream()
            .map(TaskResponse::mapToResponse)
            .toList();
    }

    // @GetMapping("/{id}")
    // public Optional<Task> getTaskById(@PathVariable Long id) {
    //     return taskRepository.findById(id);
    // }

    @GetMapping("/tasks/{id}")
    public TaskResponse getTaskById(@PathVariable Long id) {
        Task task = taskRepository.findById(id).orElseThrow();
        return TaskResponse.mapToResponse(task);
    }

    // @PostMapping
    // public Task createTask(@RequestBody TaskRequest request) {
    //     System.out.println(request);
    //     User assignedUser = userRepository.findById(request.getAssignedToId())
    //     .orElseThrow(() -> new RuntimeException("Assigned user not found"));

    //     User createdByUser = userRepository.findById(request.getCreatedById())
    //     .orElseThrow(() -> new RuntimeException("Creator user not found"));


    //     Task task = new Task();
    //     task.setTitle(request.getTitle());
    //     task.setDescription(request.getDescription());
    //     task.setStatus(request.getStatus());
    //     task.setDueDate(request.getDueDate());
    //     task.setCreatedAt(LocalDateTime.now());

    //     task.setAssignedTo(assignedUser);
    //     task.setCreatedBy(createdByUser);


    //     return taskRepository.save(task);
    // }

    @PostMapping
    public TaskResponse createTask(@RequestBody TaskRequest request) {

        User assignedUser = userRepository.findById(request.getAssignedToId())
            .orElseThrow(() -> new RuntimeException("Assigned user not found"));

        User createdByUser = userRepository.findById(request.getCreatedById())
            .orElseThrow(() -> new RuntimeException("Creator user not found"));

        Task task = new Task();
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setDueDate(request.getDueDate());
        task.setCreatedAt(LocalDateTime.now());
        task.setAssignedTo(assignedUser);
        task.setCreatedBy(createdByUser);

        Task saved = taskRepository.save(task);

        return TaskResponse.mapToResponse(saved);
    }

    // @PutMapping("/{id}")
    // public Task updateTask(@PathVariable Long id, @RequestBody TaskRequest request) {
    //     Task task = taskRepository.findById(id).orElseThrow();

    //     String title = request.getTitle();

    //     if (title != null) {
    //         task.setTitle(title);
    //     }

    //     String description = request.getDescription();
    //     if (description != null) {
    //         task.setDescription(description);
    //     }

    //     Long assignedToId = request.getAssignedToId();
    //     if (assignedToId != null) {
    //         User user = userRepository.findById(assignedToId).orElseThrow();
    //         task.setAssignedTo(user);
    //     }

    //     Long createdById = request.getCreatedById();
    //     if (createdById != null) {
    //         User user = userRepository.findById(createdById).orElseThrow();
    //         task.setCreatedBy(user);
    //     }

    //     TaskStatus status = request.getStatus();
    //     if (status != null) {
    //         task.setStatus(status);
    //     }

    //     LocalDateTime dueDate = request.getDueDate();
    //     if (dueDate != null) {
    //         task.setDueDate(dueDate);
    //     }


    //     return taskRepository.save(task);
    // }

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
}