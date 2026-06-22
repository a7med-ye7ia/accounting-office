package com.accounting.backend.dtos;

/**
 * DTO for the change-password / verify-account endpoint.
 * The user provides their email, the temporary password sent to their email,
 * and the new password they want to set.
 */
public class ChangePasswordRequest {

    private String email;
    private String currentPassword;
    private String newPassword;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
