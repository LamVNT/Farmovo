package com.farmovo.backend.services.impl;

import com.farmovo.backend.models.ForgotPassword;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.ForgotPasswordRepository;
import com.farmovo.backend.repositories.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Date;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ForgotPasswordServiceImplTest {

    @Mock
    private ForgotPasswordRepository forgotPasswordRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ForgotPasswordServiceImpl forgotPasswordService;

    private User testUser;
    private ForgotPassword testForgotPassword;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        testForgotPassword = new ForgotPassword();
        testForgotPassword.setId(1L);
        testForgotPassword.setOtp(123456);
        testForgotPassword.setUser(testUser);
    }

    @Test
    @DisplayName("verifyOtp - OTP hợp lệ và chưa hết hạn")
    void testVerifyOtp_ValidOtp_NotExpired() {
        // Arrange
        Integer otp = 123456;
        String email = "test@example.com";
        Date futureTime = new Date(System.currentTimeMillis() + 60000); // 1 phút trong tương lai
        testForgotPassword.setExpirationTime(futureTime);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(forgotPasswordRepository.findByOtpAndUser(otp, testUser))
                .thenReturn(Optional.of(testForgotPassword));

        // Act
        String result = forgotPasswordService.verifyOtp(otp, email);

        // Assert
        assertEquals("OTP verified successfully", result);
        verify(forgotPasswordRepository).delete(testForgotPassword);
    }

    @Test
    @DisplayName("verifyOtp - OTP đã hết hạn")
    void testVerifyOtp_ExpiredOtp() {
        // Arrange
        Integer otp = 123456;
        String email = "test@example.com";
        Date pastTime = new Date(System.currentTimeMillis() - 60000); // 1 phút trong quá khứ
        testForgotPassword.setExpirationTime(pastTime);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(forgotPasswordRepository.findByOtpAndUser(otp, testUser))
                .thenReturn(Optional.of(testForgotPassword));

        // Act
        String result = forgotPasswordService.verifyOtp(otp, email);

        // Assert
        assertEquals("OTP expired", result);
        verify(forgotPasswordRepository).delete(testForgotPassword);
    }

    @Test
    @DisplayName("verifyOtp - Email không tồn tại")
    void testVerifyOtp_EmailNotFound() {
        // Arrange
        Integer otp = 123456;
        String email = "nonexistent@example.com";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            forgotPasswordService.verifyOtp(otp, email);
        });
        verify(forgotPasswordRepository, never()).delete(any());
    }

    @Test
    @DisplayName("verifyOtp - OTP không hợp lệ")
    void testVerifyOtp_InvalidOtp() {
        // Arrange
        Integer otp = 999999;
        String email = "test@example.com";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(forgotPasswordRepository.findByOtpAndUser(otp, testUser))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            forgotPasswordService.verifyOtp(otp, email);
        });
        verify(forgotPasswordRepository, never()).delete(any());
    }
} 