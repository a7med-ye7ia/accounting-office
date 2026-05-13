package com.accounting.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * JWT Service
 * Handles token generation and verification.
 *
 * - Tokens are signed with HMAC-SHA256
 * - Contains user email (subject) and user id (claim)
 * - Token validity is checked against the user's stored token in the database
 */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Generate a JWT token for the given user.
     *
     * @param userId the user's database ID
     * @param email  the user's email address
     * @return signed JWT string
     */
    public String generateToken(Long userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .claims(Map.of("userId", userId))
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /**
     * Parse and verify a JWT token's signature and expiration.
     *
     * @param token the JWT string (without "Bearer " prefix)
     * @return the parsed Claims if valid
     * @throws JwtException if the token is invalid or expired
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Check if a token's signature and expiration are valid.
     *
     * @param token the JWT string
     * @return true if the token is properly signed and not expired
     */
    public boolean isTokenValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Extract the user email (subject) from a valid token.
     */
    public String extractEmail(String token) {
        return parseToken(token).getSubject();
    }

    /**
     * Extract the user ID from a valid token.
     */
    public Long extractUserId(String token) {
        Object userId = parseToken(token).get("userId");
        if (userId instanceof Integer) {
            return ((Integer) userId).longValue();
        }
        return (Long) userId;
    }
}
