package com.accounting.backend.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.accounting.backend.entities.EmployeeAssignment;

@Repository
public  interface  EmployeeAssignmentRepository extends JpaRepository<EmployeeAssignment, Long> {
    List<EmployeeAssignment> findByUser_Id(Long userId);
    void deleteByUser_Id(Long userId);
}