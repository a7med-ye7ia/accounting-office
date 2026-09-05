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
 * - Login/Register: generate JWT → store in cache → return to client
 * - Verify: check JWT signature + check it matches cached token
 * - Logout: remove token from cache
 */
@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private TokenCacheService tokenCacheService;

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

        // Generate token and store it in cache (not in DB)
        String token = jwtService.generateToken(savedUser.getId(), savedUser.getEmail());
        tokenCacheService.storeToken(savedUser.getId(), token);

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

        // Block SUSPENDED / RESIGNED users
        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.RESIGNED) {
            return new AuthResponse(false, "Account is inactive. Contact administrator.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return new AuthResponse(false, "Invalid email or password");
        }

        // Generate JWT token and store it in cache (not in DB)
        String token = jwtService.generateToken(user.getId(), user.getEmail());
        tokenCacheService.storeToken(user.getId(), token);

        UserDto userDto = new UserDto(user);

        // If the account is PENDING_VERIFICATION, allow login but signal it
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            return new AuthResponse(true,
                "Login successful. Please change your temporary password to activate your account.",
                userDto, token);
        }

        return new AuthResponse(true, "Login successful", userDto, token);
    }

    /**
     * Verify a JWT token.
     * Checks both JWT validity (signature + expiration) AND that
     * the token matches what's stored in the cache.
     *
     * @param token the raw JWT string (without "Bearer " prefix)
     * @return true if the token is valid and currently cached
     */
    public boolean verifyToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        // 1. Check JWT signature and expiration
        if (!jwtService.isTokenValid(token)) {
            return false;
        }

        // 2. Check that this token matches the one in cache
        try {
            Long userId = jwtService.extractUserId(token);
            return tokenCacheService.isTokenValid(userId, token);
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Logout: remove the user's token from cache
     */
    public void logout(String token) {
        if (token == null || token.isBlank()) {
            return;
        }

        try {
            Long userId = jwtService.extractUserId(token);
            tokenCacheService.invalidateToken(userId);
        } catch (Exception e) {
            // Token is already invalid, nothing to clean up
        }
    }

    /**
     * Get the authenticated user from a JWT token
     *
     * @param token the raw JWT string
     * @return the User if token is valid and matches the cached token
     */
    public Optional<User> getUserFromToken(String token) {
        try {
            Long userId = jwtService.extractUserId(token);
            // Only return user if the token is cached and valid
            if (!tokenCacheService.isTokenValid(userId, token)) {
                return Optional.empty();
            }
            Optional<User> userOptional = userRepository.findById(userId);
            return userOptional;
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

    /**
     * Change a user's password (used to verify their account after creation).
     *
     * Flow:
     * 1. Find the user by email.
     * 2. Verify currentPassword matches the stored hash (the temp password).
     * 3. Validate the new password (min 6 chars).
     * 4. Encode and save the new password.
     * 5. If the user was PENDING_VERIFICATION, set status to ACTIVE.
     */
    @Transactional
    public AuthResponse changePassword(com.accounting.backend.dtos.ChangePasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return new AuthResponse(false, "Email is required");
        }
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            return new AuthResponse(false, "Current password is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            return new AuthResponse(false, "New password is required");
        }
        if (request.getNewPassword().length() < 6) {
            return new AuthResponse(false, "New password must be at least 6 characters");
        }

        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(request.getEmail());
        if (userOptional.isEmpty()) {
            return new AuthResponse(false, "User not found");
        }

        User user = userOptional.get();

        // Verify current (temp) password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return new AuthResponse(false, "Current password is incorrect");
        }

        // Set the new password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());

        // Activate account if it was pending verification
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            user.setStatus(UserStatus.ACTIVE);
        }

        userRepository.save(user);

        return new AuthResponse(true, "Password changed successfully. Your account is now active.");
    }
}
