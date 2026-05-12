package com.accounting.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.accounting.backend.entities.EmployeeAssignment;

@Repository
public  interface  EmployeeAssignmentRepository extends JpaRepository<EmployeeAssignment, Long> {
}