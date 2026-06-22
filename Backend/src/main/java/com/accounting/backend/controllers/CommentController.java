package com.accounting.backend.controllers;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.dto.CommentRequest;
import com.accounting.backend.dto.CommentResponse;
import com.accounting.backend.entities.Task;
import com.accounting.backend.entities.TaskComment;
import com.accounting.backend.entities.User;
import com.accounting.backend.repositories.TaskCommentRepository;
import com.accounting.backend.repositories.TaskRepository;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.services.NotificationService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/comments")
public class CommentController {

  @Autowired
  TaskCommentRepository taskCommentRepository;

  @Autowired
  UserRepository userRepository;

  @Autowired
  TaskRepository taskRepository;

  @Autowired
  NotificationService notificationService;

  @GetMapping
  public List<TaskComment> getAllComments() {
    return taskCommentRepository.findAll();
  }

  @GetMapping("/{taskId}")
  public List<TaskComment> getCommentsByTaskId(@PathVariable Long taskId) {
    return taskCommentRepository.findByTaskId(taskId);
  }

  @PostMapping
  public CommentResponse createComment(@RequestBody CommentRequest request) {

    User commentBy = userRepository.findById(request.getCreatedById())
      .orElseThrow(() -> new RuntimeException("User not found"));

    Task task = taskRepository.findById(request.getTaskId())
      .orElseThrow(() -> new RuntimeException("Task not found"));

    User assignedTo = task.getAssignedTo(), createdBy = task.getCreatedBy();

    if (assignedTo != null && !assignedTo.getId().equals(commentBy.getId())) {
      notificationService.createNotification(
        assignedTo.getId(),
        "New comment on task: " + task.getTitle(),
        request.getMessage()
      );
    }

    if (createdBy != null && !createdBy.getId().equals(commentBy.getId())) {
      notificationService.createNotification(
        createdBy.getId(),
        "New comment on task: " + task.getTitle(),
        request.getMessage()
      );
    }

    TaskComment comment = new TaskComment();
    comment.setTask(task);
    comment.setCommentBy(commentBy);
    comment.setMessage(request.getMessage());

    TaskComment saved = taskCommentRepository.save(comment);

    return new CommentResponse(
      saved.getId(),
      saved.getMessage(),
      saved.getCommentBy().getFullName(),
      saved.getCreatedAt()
    );
  }
  
  @DeleteMapping("/{id}")
  public void deleteComment(@PathVariable Long id) {
    taskCommentRepository.deleteById(id);
  }

}
