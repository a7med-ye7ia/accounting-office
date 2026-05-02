package com.accounting.backend.controllers;

import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
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