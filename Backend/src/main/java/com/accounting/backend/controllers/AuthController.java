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
 * POST /api/auth/login - Login user
 * GET /api/auth/me - Get current user info
 * POST /api/auth/logout - Logout user
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
     * "fullName": "John Doe",
     * "email": "john@example.com",
     * "password": "SecurePass123!",
     * "phone": "0123456789",
     * "nationalId": "12345678"
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
     * "email": "john@example.com",
     * "password": "SecurePass123!"
     * }
     *
     * Response: 200 OK with JWT token | 401 Unauthorized
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

        String token = extractToken(authHeader);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Missing or invalid token"));
        }

        if (!authService.verifyToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Invalid or expired token"));
        }

        Optional<User> userOptional = authService.getUserFromToken(token);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "User not found"));
        }

        UserDto userDto = new UserDto(userOptional.get());
        authService.enrichUserDto(userDto, userOptional.get().getId());
        return ResponseEntity.ok(new AuthResponse(true, "Current user retrieved", userDto, token));
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

        String token = extractToken(authHeader);
        if (token != null) {
            authService.logout(token);
        }

        return ResponseEntity.ok(new AuthResponse(true, "Logout successful"));
    }

    @GetMapping("/verify")
    public ResponseEntity<AuthResponse> verifyToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String token = extractToken(authHeader);

        if (token == null || !authService.verifyToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(false, "Invalid token"));
        }

        return ResponseEntity.ok(new AuthResponse(true, "Token is valid"));
    }

    /**
     * POST /api/auth/change-password
     * Allows a user to change their password using their temporary password.
     * If the user's status is PENDING_VERIFICATION, it will be changed to ACTIVE
     * upon successful password change, unlocking their account.
     *
     * Request body:
     * {
     *   "email": "user@example.com",
     *   "currentPassword": "12345678",
     *   "newPassword": "MyNewSecurePass!"
     * }
     *
     * Response: 200 OK | 400 Bad Request
     */
    @PostMapping("/change-password")
    public ResponseEntity<AuthResponse> changePassword(
            @RequestBody com.accounting.backend.dtos.ChangePasswordRequest request) {
        AuthResponse response = authService.changePassword(request);
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Extract the raw JWT token from the Authorization header.
     *
     * @param authHeader the full Authorization header value (e.g. "Bearer eyJhbG...")
     * @return the raw token string, or null if the header is missing/malformed
     */
    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        return null;
    }
}
