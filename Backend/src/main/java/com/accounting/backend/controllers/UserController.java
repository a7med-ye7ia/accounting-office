package com.accounting.backend.controllers;

import com.accounting.backend.entities.User;
import com.accounting.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return userRepository.save(user);
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
        // user.setCreatedAt(userDetails.getCreatedAt());
        // user.setUpdatedAt(userDetails.getUpdatedAt());
        user.setUpdatedAt(LocalDateTime.now());
        // user.setDeletedAt(userDetails.getDeletedAt());
        return userRepository.save(user);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
    }
}