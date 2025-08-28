package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.SendLoginInfoRequestDto;
import com.farmovo.backend.exceptions.InvalidStatusException;
import org.springframework.stereotype.Component;
import java.util.regex.Pattern;

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

    // Email validation pattern
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    );

    // Validation cho email
    public void validateEmail(String email) {
        if (email != null && !email.trim().isEmpty()) {
            if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
                throw new IllegalArgumentException("Invalid email format");
            }
            if (email.length() > 255) {
                throw new IllegalArgumentException("Email must not exceed 255 characters");
            }
        }
    }

    // Validation cho email khi tạo mới (có thể bắt buộc hoặc không tùy theo yêu cầu)
    public void validateEmailForCreate(String email) {
        // Email có thể không bắt buộc khi tạo user
        if (email != null && !email.trim().isEmpty()) {
            validateEmail(email);
        }
    }

    // Validation cho email khi cập nhật
    public void validateEmailForUpdate(String email) {
        // Email có thể không bắt buộc khi cập nhật
        if (email != null && !email.trim().isEmpty()) {
            validateEmail(email);
        }
    }

    // Validation cho email không bị duplicate khi tạo mới
    public void validateEmailForCreate(String email, boolean isEmailExists) {
        // Email có thể không bắt buộc khi tạo user
        if (email != null && !email.trim().isEmpty()) {
            validateEmail(email);
            
            // Kiểm tra email đã tồn tại chưa
            if (isEmailExists) {
                throw new IllegalArgumentException("Email đã được sử dụng bởi tài khoản khác");
            }
        }
    }

    // Validation cho email không bị duplicate khi cập nhật
    public void validateEmailForUpdate(String email, boolean isEmailExists, Long currentUserId) {
        // Email có thể không bắt buộc khi cập nhật
        if (email != null && !email.trim().isEmpty()) {
            validateEmail(email);
            
            // Kiểm tra email đã tồn tại chưa (trừ user hiện tại)
            if (isEmailExists) {
                throw new IllegalArgumentException("Email đã được sử dụng bởi tài khoản khác");
            }
        }
    }

    // Validation cho SendLoginInfoRequestDto
    public void validateSendLoginInfoRequest(SendLoginInfoRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }
        
        // Validate email
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống");
        }
        validateEmail(request.getEmail());
        
        // Validate username
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("Username không được để trống");
        }
        if (request.getUsername().length() > 50) {
            throw new IllegalArgumentException("Username không được vượt quá 50 ký tự");
        }
        
        // Validate password
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password không được để trống");
        }
        PasswordValidator.PasswordValidationResult passwordResult = PasswordValidator.validatePassword(request.getPassword());
        if (!passwordResult.isValid()) {
            throw new IllegalArgumentException("Password validation failed: " + passwordResult.getErrorMessage());
        }
        
        // Validate fullName
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name không được để trống");
        }
        if (request.getFullName().length() > 50) {
            throw new IllegalArgumentException("Full name không được vượt quá 50 ký tự");
        }
        
        // Validate storeName
        if (request.getStoreName() == null || request.getStoreName().trim().isEmpty()) {
            throw new IllegalArgumentException("Store name không được để trống");
        }
    }
}