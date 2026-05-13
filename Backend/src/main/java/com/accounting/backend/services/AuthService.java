package com.accounting.backend.services;

import com.accounting.backend.dtos.AuthResponse;
import com.accounting.backend.dtos.LoginRequest;
import com.accounting.backend.dtos.RegisterRequest;
import com.accounting.backend.dtos.UserDto;
import com.accounting.backend.entities.User;
import com.accounting.backend.enums.UserStatus;
import com.accounting.backend.repositories.UserRepository;
import com.accounting.backend.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Authentication Service
 * Handles login, register, and password operations.
 *
 * Token lifecycle:
 * - Login/Register: generate JWT → save to user.token → return to client
 * - Verify: check JWT signature + check it matches user.token in DB
 * - Logout: set user.token = null → token is destroyed
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Register a new user
     */
    @Transactional
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
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(request.getEmail());

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

        // Generate token and assign it to the user
        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());
        savedUser.setToken(token);
        userRepository.save(savedUser);

        UserDto userDto = new UserDto(savedUser);
        return new AuthResponse(true, "Registration successful", userDto, token);
    }

    /**
     * Login user with email and password
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Validate input
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return new AuthResponse(false, "Email is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return new AuthResponse(false, "Password is required");
        }

        // Find user by email
        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(request.getEmail());

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

        // Generate JWT token and save it to the user
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        user.setToken(token);
        userRepository.save(user);

        UserDto userDto = new UserDto(user);
        return new AuthResponse(true, "Login successful", userDto, token);
    }

    /**
     * Verify a JWT token.
     * Checks both JWT validity (signature + expiration) AND that
     * the token matches what's stored on the user in the database.
     *
     * @param token the raw JWT string (without "Bearer " prefix)
     * @return true if the token is valid and currently assigned to the user
     */
    public boolean verifyToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        // 1. Check JWT signature and expiration
        if (!jwtService.isTokenValid(token)) {
            return false;
        }

        // 2. Check that this token matches the one stored on the user
        try {
            Long userId = jwtService.extractUserId(token);
            Optional<User> userOptional = userRepository.findById(userId);
            return userOptional.isPresent() && token.equals(userOptional.get().getToken());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Logout: destroy the user's token
     */
    @Transactional
    public void logout(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            Long userId = jwtService.extractUserId(token);
            Optional<User> userOptional = userRepository.findById(userId);
            if (userOptional.isPresent()) {
                User user = userOptional.get();
                user.setToken(null);
                userRepository.save(user);
            }
        } catch (Exception e) {
            // Token is already invalid, nothing to clean up
        }
    }

    /**
     * Get the authenticated user from a JWT token
     *
     * @param token the raw JWT string
     * @return the User if token is valid and matches the stored token
     */
    public Optional<User> getUserFromToken(String token) {
        try {
            Long userId = jwtService.extractUserId(token);
            Optional<User> userOptional = userRepository.findById(userId);
            // Only return user if the token matches
            if (userOptional.isPresent() && token.equals(userOptional.get().getToken())) {
                return userOptional;
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    /**
     * Get user by email
     */
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }
}
