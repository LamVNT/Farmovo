package com.farmovo.backend.dto.response;

public record OtpVerificationResponse(
    String message,
    String status,
    String errorType
) {
    
    public static OtpVerificationResponse success(String message) {
        return new OtpVerificationResponse(message, "success", null);
    }
    
    public static OtpVerificationResponse error(String message, String errorType) {
        return new OtpVerificationResponse(message, "error", errorType);
    }
} 