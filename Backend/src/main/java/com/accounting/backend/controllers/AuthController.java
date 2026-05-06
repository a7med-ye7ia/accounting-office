package com.accounting.backend.controllers;

import com.accounting.backend.dtos.AuthResponse;
import com.accounting.backend.dtos.LoginRequest;
import com.accounting.backend.dtos.RegisterRequest;
import com.accounting.backend.dtos.UserDto;
import com.accounting.backend.entities.User;
import com.accounting.backend.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

/**
 * Authentication Controller
 * Handles login, register, and logout operations
 *
 * Endpoints:
 * POST /api/auth/register - Register new user
 * POST /api/auth/login    - Login user
 * GET  /api/auth/me       - Get current user info
 * POST /api/auth/logout   - Logout user
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * POST /api/auth/register
     * Register a new user
     *
     * Request body:
     * {
     *   "fullName": "John Doe",
     *   "email": "john@example.com",
     *   "password": "SecurePass123!",
     *   "phone": "0123456789",
     *   "nationalId": "12345678"
     * }
     *
     * Response: 200 OK | 400 Bad Request
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * POST /api/auth/login
     * Login user with email and password
     *
     * Request body:
     * {
     *   "email": "john@example.com",
     *   "password": "SecurePass123!"
     * }
     *
     * Response: 200 OK | 401 Unauthorized
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    /**
     * GET /api/auth/me
     * Get current authenticated user information
     *
     * Header: Authorization: Bearer <token>
     *
     * Response: 200 OK | 401 Unauthorized
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer_")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Missing or invalid token"));
        }

        String token = authHeader.substring(7);

        if (!authService.verifyToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Invalid or expired token"));
        }

        // In a real application, extract user ID from JWT token
        // For now, this is a placeholder
        AuthResponse response = new AuthResponse(true, "Current user retrieved");
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/logout
     * Logout user (invalidate token)
     *
     * Header: Authorization: Bearer <token>
     *
     * Response: 200 OK
     */
    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        // In a real application, invalidate the token in the database or token blacklist
        // For now, just return success
        AuthResponse response = new AuthResponse(true, "Logout successful");
        return ResponseEntity.ok(response);
    }
}
