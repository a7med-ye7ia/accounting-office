package com.accounting.backend.services;

import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Token Cache Service
 * Stores JWT tokens in memory (cache) instead of the database.
 * 
 * Token lifecycle:
 * - Store: save token to cache on login/register
 * - Verify: check if token exists in cache
 * - Invalidate: remove token from cache on logout
 */
@Service
public class TokenCacheService {
    
    // Map userId -> token
    private final ConcurrentHashMap<Long, String> tokenCache = new ConcurrentHashMap<>();
    
    /**
     * Store a token for a user in cache
     * 
     * @param userId the user's ID
     * @param token the JWT token
     */
    public void storeToken(Long userId, String token) {
        if (userId != null && token != null && !token.isBlank()) {
            tokenCache.put(userId, token);
        }
    }
    
    /**
     * Get a user's token from cache
     * 
     * @param userId the user's ID
     * @return the token if it exists, null otherwise
     */
    public String getToken(Long userId) {
        return tokenCache.get(userId);
    }
    
    /**
     * Verify if a token matches the cached token for a user
     * 
     * @param userId the user's ID
     * @param token the token to verify
     * @return true if the token matches the cached token
     */
    public boolean isTokenValid(Long userId, String token) {
        if (userId == null || token == null || token.isBlank()) {
            return false;
        }
        String cachedToken = tokenCache.get(userId);
        return token.equals(cachedToken);
    }
    
    /**
     * Invalidate (remove) a user's token from cache
     * 
     * @param userId the user's ID
     */
    public void invalidateToken(Long userId) {
        if (userId != null) {
            tokenCache.remove(userId);
        }
    }
    
    /**
     * Clear all cached tokens
     * Useful for testing or admin operations
     */
    public void clearAll() {
        tokenCache.clear();
    }
    
    /**
     * Get the number of cached tokens
     * Useful for monitoring
     */
    public int getTokenCount() {
        return tokenCache.size();
    }
}
