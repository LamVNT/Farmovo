package com.farmovo.backend.validator;

import com.farmovo.backend.exceptions.InvalidStatusException;
import org.springframework.stereotype.Component;

@Component
public class InputUserValidation {

    // Validation cho tạo mới (tất cả trường bắt buộc)
    public void validateUserFieldsForCreate(String fullName, String  username, String password) {
        if (fullName == null || fullName.trim().isEmpty() || fullName.length() > 50) {
            throw new IllegalArgumentException("Full name must be non-empty and not exceed 50 characters");
        }
        if (username == null || username.trim().isEmpty() || username.length() > 50) {
            throw new IllegalArgumentException("Account must be non-empty and not exceed 50 characters");
        }
        
        // Validate password strength using PasswordValidator
        PasswordValidator.PasswordValidationResult passwordResult = PasswordValidator.validatePassword(password);
        if (!passwordResult.isValid()) {
            throw new IllegalArgumentException("Password validation failed: " + passwordResult.getErrorMessage());
        }
    }

    // Validation cho cập nhật (password không bắt buộc)
    public void validateUserFieldsForUpdate(String fullName, String username, String password) {
        if (fullName != null && (!fullName.trim().isEmpty() && fullName.length() > 50)) {
            throw new IllegalArgumentException("Full name must not exceed 50 characters if provided");
        }
        if (username != null && (!username.trim().isEmpty() && username.length() > 50)) {
            throw new IllegalArgumentException("Account must not exceed 50 characters if provided");
        }
        
        // Validate password strength if provided
        if (password != null && !password.trim().isEmpty()) {
            PasswordValidator.PasswordValidationResult passwordResult = PasswordValidator.validatePassword(password);
            if (!passwordResult.isValid()) {
                throw new IllegalArgumentException("Password validation failed: " + passwordResult.getErrorMessage());
            }
        }
    }

    // Validation cho status (dùng Boolean thay vì chuỗi)
    public void validateUserStatus(Boolean status) {
        if (status == null) {
            throw new InvalidStatusException("Status must not be null");
        }
        // Không cần kiểm tra "active" hoặc "deactive" vì status là Boolean (true/false)
    }
}