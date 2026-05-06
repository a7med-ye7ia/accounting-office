package com.accounting.backend.services;

import com.accounting.backend.dtos.AuthResponse;
import com.accounting.backend.dtos.LoginRequest;
import com.accounting.backend.dtos.RegisterRequest;
import com.accounting.backend.dtos.UserDto;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Authentication Service
 * Handles login, register, and password operations
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Register a new user
     */
    public AuthResponse register(RegisterRequest request) {
        // Validate input
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return new AuthResponse(false, "Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return new AuthResponse(false, "Password is required");
        }
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return new AuthResponse(false, "Full name is required");
        }

        // Check if email already exists
        java.util.Optional<User> existingUser = userRepository.findAll().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(request.getEmail()))
                .findFirst();

        if (existingUser.isPresent()) {
            return new AuthResponse(false, "Email already registered");
        }

        // Create new user
        User newUser = new User();
        newUser.setFullName(request.getFullName());
        newUser.setEmail(request.getEmail().toLowerCase().trim());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setPhone(request.getPhone());
        newUser.setNationalId(request.getNationalId());
        newUser.setStatus(UserStatus.ACTIVE);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(newUser);

        String token = generateToken(savedUser);

        UserDto userDto = new UserDto(savedUser);
        return new AuthResponse(true, "Registration successful", userDto, token);
    }

    /**
     * Login user with email and password
     */
    public AuthResponse login(LoginRequest request) {
        // Validate input
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return new AuthResponse(false, "Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return new AuthResponse(false, "Password is required");
        }

        // Find user by email
        Optional<User> userOptional = userRepository.findAll().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(request.getEmail()))
                .findFirst();

        if (userOptional.isEmpty()) {
            return new AuthResponse(false, "Invalid email or password");
        }

        User user = userOptional.get();

        // Check if user is active
        if (user.getStatus() != UserStatus.ACTIVE) {
            return new AuthResponse(false, "Account is inactive. Contact administrator.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new AuthResponse(false, "Invalid email or password");
        }

        // Generate token
        String token = generateToken(user);

        UserDto userDto = new UserDto(user);
        return new AuthResponse(true, "Login successful", userDto, token);
    }

    /**
     * Verify token (basic implementation)
     */
    public boolean verifyToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        // In production, use JWT for proper token verification
        // This is a placeholder for basic token validation
        return token.length() > 20;
    }

    /**
     * Generate a simple token (in production, use JWT)
     */
    private String generateToken(User user) {
        // In production, use JWT (JSON Web Token)
        // For now, using a simple UUID-based token
        return "Bearer_" + UUID.randomUUID().toString() + "_" + user.getId();
    }

    /**
     * Get user by email
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findAll().stream()
                .filter(u -> u.getEmail().equalsIgnoreCase(email))
                .findFirst();
    }
}
