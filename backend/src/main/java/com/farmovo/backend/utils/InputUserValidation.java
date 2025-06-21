package com.farmovo.backend.utils;

import com.farmovo.backend.exceptions.InvalidStatusException;
import org.springframework.stereotype.Component;

@Component
public class InputUserValidation {
    public void validateUserStatus(String status) {
        if (status == null || (!"active".equalsIgnoreCase(status) && !"deactive".equalsIgnoreCase(status))) {
            throw new InvalidStatusException("Status must be either 'active' or 'deactive'");
        }
    }

    public void validateUserFields(String fullName, String username, String password) {
        if (fullName == null || fullName.trim().isEmpty() || fullName.length() > 50) {
            throw new IllegalArgumentException("Full name must be non-empty and not exceed 50 characters");
        }
        if (username == null || username.trim().isEmpty() || username.length() > 50) {
            throw new IllegalArgumentException("Account must be non-empty and not exceed 50 characters");
        }
        if (password == null || password.trim().isEmpty() || password.length() > 64) {
            throw new IllegalArgumentException("Password must be non-empty and not exceed 64 characters");
        }
    }
}
