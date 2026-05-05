package com.accounting.backend.controllers;

import com.accounting.backend.entities.TaskApproval;
import com.accounting.backend.repositories.TaskApprovalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/task-approvals")
public class TaskApprovalController {

    @Autowired
    private TaskApprovalRepository taskApprovalRepository;

    @GetMapping
    public List<TaskApproval> getAllTaskApprovals() {
        return taskApprovalRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<TaskApproval> getTaskApprovalById(@PathVariable Long id) {
        return taskApprovalRepository.findById(id);
    }

    @PostMapping
    public TaskApproval createTaskApproval(@RequestBody TaskApproval taskApproval) {
        return taskApprovalRepository.save(taskApproval);
    }

    @PutMapping("/{id}")
    public TaskApproval updateTaskApproval(@PathVariable Long id, @RequestBody TaskApproval taskApprovalDetails) {
        TaskApproval taskApproval = taskApprovalRepository.findById(id).orElseThrow();
        taskApproval.setTask(taskApprovalDetails.getTask());
        taskApproval.setApprovedBy(taskApprovalDetails.getApprovedBy());
        taskApproval.setStatus(taskApprovalDetails.getStatus());
        taskApproval.setComment(taskApprovalDetails.getComment());
        taskApproval.setApprovedAt(taskApprovalDetails.getApprovedAt());
        return taskApprovalRepository.save(taskApproval);
    }

    @DeleteMapping("/{id}")
    public void deleteTaskApproval(@PathVariable Long id) {
        taskApprovalRepository.deleteById(id);
    }
}