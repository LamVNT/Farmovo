package com.farmovo.backend.services;

import java.util.Map;

public interface ForgotPasswordService {

    String verifyOtp(Integer otp, String email);
    
    /**
     * Gửi OTP cho email quên mật khẩu
     * @param email Email cần gửi OTP
     * @return Map chứa message và expirationTime
     */
    Map<String, Object> sendOtpForForgotPassword(String email);
}
