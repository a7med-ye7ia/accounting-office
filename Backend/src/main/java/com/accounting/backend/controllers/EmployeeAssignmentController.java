package com.accounting.backend.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/employee-assignments")
public class EmployeeAssignmentController {

    @Autowired
    private EmployeeAssignmentRepository employeeAssignmentRepository;

    @GetMapping
    public List<EmployeeAssignment> getAllEmployeeAssignments() {
        return employeeAssignmentRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<EmployeeAssignment> getEmployeeAssignmentById(@PathVariable Long id) {
        return employeeAssignmentRepository.findById(id);
    }

    @PostMapping
    public EmployeeAssignment createEmployeeAssignment(@RequestBody EmployeeAssignment employeeAssignment) {
        return employeeAssignmentRepository.save(employeeAssignment);
    }

    @PutMapping("/{id}")
    public EmployeeAssignment updateEmployeeAssignment(@PathVariable Long id, @RequestBody EmployeeAssignment employeeAssignmentDetails) {
        EmployeeAssignment employeeAssignment = employeeAssignmentRepository.findById(id).orElseThrow();
        employeeAssignment.setUser(employeeAssignmentDetails.getUser());
        employeeAssignment.setBranch(employeeAssignmentDetails.getBranch());
        employeeAssignment.setDepartment(employeeAssignmentDetails.getDepartment());
        employeeAssignment.setIsPrimary(employeeAssignmentDetails.getIsPrimary());
        employeeAssignment.setStartDate(employeeAssignmentDetails.getStartDate());
        employeeAssignment.setEndDate(employeeAssignmentDetails.getEndDate());
        return employeeAssignmentRepository.save(employeeAssignment);
    }

    @DeleteMapping("/{id}")
    public void deleteEmployeeAssignment(@PathVariable Long id) {
        employeeAssignmentRepository.deleteById(id);
    }
}