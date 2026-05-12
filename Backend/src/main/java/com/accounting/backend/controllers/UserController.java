package com.accounting.backend.controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.accounting.backend.dtos.EmployeeCreationRequest;
import com.accounting.backend.entities.Branch;
import com.accounting.backend.entities.Department;
import com.accounting.backend.entities.EmployeeAssignment;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.BranchRepository;
import com.accounting.backend.repositories.DepartmentRepository;
import com.accounting.backend.repositories.EmployeeAssignmentRepository;
import com.accounting.backend.repositories.UserRepository;

import jakarta.transaction.Transactional;
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private DepartmentRepository DepartmentRepository;
    @Autowired
    private BranchRepository BranchRepository;
    @Autowired
    private EmployeeAssignmentRepository EmployeeAssignmentRepository;
    

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id);
    }
@PostMapping
    @Transactional 
    public ResponseEntity<?> createUser(@RequestBody EmployeeCreationRequest request) {
        
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setNationalId(request.getNationalId());
        user.setPassword(request.getPassword() != null ? request.getPassword() : "123456"); 
        user.setHireDate(request.getHireDate());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        if (request.getStatus() != null) {
            user.setStatus(UserStatus.valueOf(request.getStatus()));
        }

        User savedUser = userRepository.save(user);

        if (request.getDepartmentId() != null && request.getBranchId() != null) {
            
            Department dept = DepartmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("القسم غير موجود"));
            
            Branch branch = BranchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new RuntimeException("الفرع غير موجود"));

            EmployeeAssignment assignment = new EmployeeAssignment();
            assignment.setUser(savedUser);
            assignment.setDepartment(dept);
            assignment.setBranch(branch);
            assignment.setIsPrimary(true); 
            assignment.setStartDate(request.getHireDate() != null ? request.getHireDate() : LocalDate.now());
            
            EmployeeAssignmentRepository.save(assignment);
        }

        
        return ResponseEntity.ok(savedUser);
    }
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        User user = userRepository.findById(id).orElseThrow();
        user.setFullName(userDetails.getFullName());
        user.setEmail(userDetails.getEmail());
        user.setPhone(userDetails.getPhone());
        user.setNationalId(userDetails.getNationalId());
        user.setPassword(userDetails.getPassword());
        user.setStatus(userDetails.getStatus());
        user.setHireDate(userDetails.getHireDate());
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }


    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        // TODO : handle the delete logic (soft delete)
        userRepository.deleteById(id);
    }
}