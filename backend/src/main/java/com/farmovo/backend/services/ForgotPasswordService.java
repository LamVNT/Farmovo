package com.farmovo.backend.services;

import java.util.Map;

public interface ForgotPasswordService {

    String verifyOtp(Integer otp, String email);
    Map<String, Object> sendOtpForForgotPassword(String email);
}
