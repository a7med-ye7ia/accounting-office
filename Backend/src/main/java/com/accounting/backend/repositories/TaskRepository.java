package com.accounting.backend.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.accounting.backend.entities.Task;

import jakarta.persistence.LockModeType;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedTo_Id(Long assignedToUserId);
    List<Task> findByCreatedBy_Id(Long createdByUserId);

    @Query("""
            SELECT DISTINCT t FROM Task t
            LEFT JOIN t.subTasks s
            WHERE t.assignedTo.id = :userId
               OR (
                    s.deletedAt IS NULL
                    AND s.assignedTo.id = :userId
                    AND s.status <> com.accounting.backend.enums.SubTaskStatus.DONE
               )
               OR (
                    t.assignedTo IS NULL
                    AND NOT EXISTS (
                        SELECT 1 FROM SubTask activeSubTask
                        WHERE activeSubTask.task = t
                          AND activeSubTask.deletedAt IS NULL
                          AND activeSubTask.assignedTo IS NOT NULL
                          AND activeSubTask.status <> com.accounting.backend.enums.SubTaskStatus.DONE
                    )
                    AND (
                        t.department IS NULL
                        OR EXISTS (
                            SELECT 1 FROM EmployeeAssignment ea
                            WHERE ea.user.id = :userId
                              AND ea.department.id = t.department.id
                              AND ea.branch.id = t.department.branch.id
                              AND (ea.endDate IS NULL OR ea.endDate >= CURRENT_DATE)
                        )
                    )
               )
            """)
    List<Task> findVisibleToAssignee(@Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Task t WHERE t.id = :id")
    Optional<Task> findByIdForUpdate(@Param("id") Long id);
}
