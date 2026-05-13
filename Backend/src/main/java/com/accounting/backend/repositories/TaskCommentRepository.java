package com.accounting.backend.repositories;

import com.accounting.backend.entities.TaskComment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
  List<TaskComment> findByTaskId(Long taskId);
}
