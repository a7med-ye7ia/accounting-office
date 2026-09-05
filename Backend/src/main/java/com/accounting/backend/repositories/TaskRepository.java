package com.accounting.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.accounting.backend.entities.Task;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedTo_Id(Long assignedToUserId);
    List<Task> findByCreatedBy_Id(Long createdByUserId);
    List<Task> findByDeletedAtIsNull();
    List<Task> findByDeletedAtIsNullAndAssignedTo_Id(Long assignedToUserId);
    List<Task> findByDeletedAtIsNullAndCreatedBy_Id(Long createdByUserId);
    List<Task> findByCompany_Id(Long companyId);
}