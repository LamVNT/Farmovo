package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.OtpRequest;
import org.springframework.stereotype.Component;

@Component
public class OtpValidator {
    
    public ValidationResult validateOtp(OtpRequest request) {
        String otp = request.otp();
        
        // Check if OTP is null or empty
        if (otp == null || otp.trim().isEmpty()) {
            return ValidationResult.error("MISSING_OTP", "Vui lòng nhập mã OTP.");
        }
        
        // Check if OTP contains only digits
        if (!otp.matches("\\d+")) {
            return ValidationResult.error("INVALID_OTP_FORMAT", "Mã OTP chỉ được chứa số. Vui lòng kiểm tra lại.");
        }
        
        // Check OTP length
        if (otp.length() != 6) {
            return ValidationResult.error("INVALID_OTP_LENGTH", "Mã OTP phải có 6 chữ số. Vui lòng kiểm tra lại.");
        }
        
        return ValidationResult.success();
    }
    
    public static class ValidationResult {
        private final boolean valid;
        private final String errorType;
        private final String errorMessage;
        
        private ValidationResult(boolean valid, String errorType, String errorMessage) {
            this.valid = valid;
            this.errorType = errorType;
            this.errorMessage = errorMessage;
        }
        
        public static ValidationResult success() {
            return new ValidationResult(true, null, null);
        }
        
        public static ValidationResult error(String errorType, String errorMessage) {
            return new ValidationResult(false, errorType, errorMessage);
        }
        
        public boolean isValid() {
            return valid;
        }
        
        public String getErrorType() {
            return errorType;
        }
        
        public String getErrorMessage() {
            return errorMessage;
        }
    }
} 