package com.farmovo.backend.services;

public interface ForgotPasswordService {

    String verifyOtp(Integer otp, String email);
}
