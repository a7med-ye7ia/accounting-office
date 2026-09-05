package com.accounting.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.accounting.backend.entities.SubTask;

@Repository
public interface SubTaskRepository extends JpaRepository<SubTask, Long> {

    List<SubTask> findByTask_IdAndDeletedAtIsNull(Long taskId);

    Optional<SubTask> findByIdAndTask_IdAndDeletedAtIsNull(Long id, Long taskId);
}
