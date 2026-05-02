package com.accounting.backend.repositories;

import com.accounting.backend.entities.EmployeeAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeAssignmentRepository extends JpaRepository<EmployeeAssignment, Long> {
}