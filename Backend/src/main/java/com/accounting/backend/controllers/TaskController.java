package com.accounting.backend.controllers;

import com.accounting.backend.entities.Task;
import com.accounting.backend.repositories.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Task> getTaskById(@PathVariable Long id) {
        return taskRepository.findById(id);
    }

    @PostMapping
    public Task createTask(@RequestBody Task task) {
        task.setCreatedAt(LocalDateTime.now());
        return taskRepository.save(task);
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id, @RequestBody Task taskDetails) {
        Task task = taskRepository.findById(id).orElseThrow();
        task.setTitle(taskDetails.getTitle());
        task.setDescription(taskDetails.getDescription());
        task.setAssignedTo(taskDetails.getAssignedTo());
        task.setCreatedBy(taskDetails.getCreatedBy());
        task.setStatus(taskDetails.getStatus());
        task.setDueDate(taskDetails.getDueDate());
        task.setDepartment(taskDetails.getDepartment());
        return taskRepository.save(task);
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable Long id) {
        // TODO : handle the delete logic (soft delete)
        taskRepository.deleteById(id);
    }
}