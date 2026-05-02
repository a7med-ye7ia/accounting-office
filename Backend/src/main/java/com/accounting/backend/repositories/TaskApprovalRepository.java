package com.accounting.backend.repositories;

import com.accounting.backend.entities.TaskApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskApprovalRepository extends JpaRepository<TaskApproval, Long> {
}