package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.ChangePassword;
import com.farmovo.backend.dto.response.MailBody;
import com.farmovo.backend.dto.request.OtpRequest;
import com.farmovo.backend.models.ForgotPassword;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.ForgotPasswordRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.ForgotPasswordService;
import com.farmovo.backend.services.impl.EmailServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Date;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@WebMvcTest(ForgotPasswordController.class)
class ForgotPasswordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private EmailServiceImpl emailService;

    @MockBean
    private ForgotPasswordRepository forgotPasswordRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private ForgotPasswordService forgotPasswordService;

    @Autowired
    private ObjectMapper objectMapper;

    private User testUser;
    private ForgotPassword testForgotPassword;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");

        testForgotPassword = new ForgotPassword();
        testForgotPassword.setId(1L);
        testForgotPassword.setOtp(123456);
        testForgotPassword.setUser(testUser);
        testForgotPassword.setExpirationTime(new Date(System.currentTimeMillis() + 70000));
    }

    @Test
    @DisplayName("POST /verifyMail/{email} - Email hợp lệ")
    void testVerifyMail_ValidEmail() throws Exception {
        // Arrange
        String email = "test@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        doNothing().when(forgotPasswordRepository).deleteByUserId(testUser.getId());
        doNothing().when(emailService).sendSimpleMessage(any(MailBody.class));
        when(forgotPasswordRepository.save(any(ForgotPassword.class))).thenReturn(testForgotPassword);

        // Act & Assert
        mockMvc.perform(post("/api/forgot-password/verifyMail/{email}", email))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP đã được gửi đến email của bạn."))
                .andExpect(jsonPath("$.expirationTime").exists());

        verify(forgotPasswordRepository).deleteByUserId(testUser.getId());
        verify(emailService).sendSimpleMessage(any(MailBody.class));
        verify(forgotPasswordRepository).save(any(ForgotPassword.class));
    }

    @Test
    @DisplayName("POST /verifyMail/{email} - Email không tồn tại")
    void testVerifyMail_InvalidEmail() throws Exception {
        // Arrange
        String email = "nonexistent@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(post("/api/forgot-password/verifyMail/{email}", email))
                .andExpect(status().isInternalServerError());

        verify(forgotPasswordRepository, never()).deleteByUserId(any());
        verify(emailService, never()).sendSimpleMessage(any());
    }

    @Test
    @DisplayName("POST /verifyOtp/{email} - OTP hợp lệ")
    void testVerifyOtp_ValidOtp() throws Exception {
        // Arrange
        Integer otp = 123456;
        String email = "test@example.com";
        when(forgotPasswordService.verifyOtp(otp, email)).thenReturn("OTP verified successfully");

        // Act & Assert
        OtpRequest otpRequest = new OtpRequest("123456");
        mockMvc.perform(post("/api/forgot-password/verifyOtp/{email}", email)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(otpRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP verified successfully"))
                .andExpect(jsonPath("$.status").value("success"));
        
        // Verify service was called
        verify(forgotPasswordService).verifyOtp(otp, email);
    }

    @Test
    @DisplayName("POST /verifyOtp/{email} - OTP hết hạn")
    void testVerifyOtp_ExpiredOtp() throws Exception {
        // Arrange
        Integer otp = 123456;
        String email = "test@example.com";
        when(forgotPasswordService.verifyOtp(otp, email)).thenReturn("OTP expired");

        // Act & Assert
        OtpRequest otpRequest = new OtpRequest("123456");
        mockMvc.perform(post("/api/forgot-password/verifyOtp/{email}", email)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(otpRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("OTP expired"))
                .andExpect(jsonPath("$.status").value("error"));
    }

    @Test
    @DisplayName("POST /change-password/{email} - Mật khẩu hợp lệ")
    void testChangePassword_ValidPassword() throws Exception {
        // Arrange
        String email = "test@example.com";
        ChangePassword changePassword = new ChangePassword("StrongP@ss123", "StrongP@ss123");
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        doNothing().when(userRepository).updatePassword(email, "encodedPassword");
        doNothing().when(forgotPasswordRepository).deleteByUserId(testUser.getId());

        // Act & Assert
        mockMvc.perform(post("/api/forgot-password/change-password/{email}", email)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePassword)))
                .andExpect(status().isOk())
                .andExpect(content().string("Password has been changed!"));

        verify(passwordEncoder).encode("StrongP@ss123");
        verify(userRepository).updatePassword(email, "encodedPassword");
        verify(forgotPasswordRepository).deleteByUserId(testUser.getId());
    }

    @Test
    @DisplayName("POST /change-password/{email} - Mật khẩu không khớp")
    void testChangePassword_PasswordMismatch() throws Exception {
        // Arrange
        String email = "test@example.com";
        ChangePassword changePassword = new ChangePassword("newPassword123", "differentPassword");

        // Act & Assert
        mockMvc.perform(post("/api/forgot-password/change-password/{email}", email)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePassword)))
                .andExpect(status().isExpectationFailed())
                .andExpect(content().string("Please enter the password again"));

        verify(userRepository, never()).updatePassword(anyString(), anyString());
    }

    @Test
    @DisplayName("POST /change-password/{email} - Email không tồn tại")
    void testChangePassword_EmailNotFound() throws Exception {
        // Arrange
        String email = "nonexistent@example.com";
        ChangePassword changePassword = new ChangePassword("StrongP@ss123", "StrongP@ss123");
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        mockMvc.perform(post("/api/forgot-password/change-password/{email}", email)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePassword)))
                .andExpect(status().isInternalServerError());

        verify(userRepository, never()).updatePassword(anyString(), anyString());
    }

    @Test
    @DisplayName("POST /change-password/{email} - Mật khẩu yếu")
    void testChangePassword_WeakPassword() throws Exception {
        // Arrange
        String email = "test@example.com";
        ChangePassword changePassword = new ChangePassword("weak", "weak");
        
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

        // Act & Assert
        mockMvc.perform(post("/api/forgot-password/change-password/{email}", email)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(changePassword)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Password validation failed")));

        verify(userRepository, never()).updatePassword(anyString(), anyString());
    }

    @Test
    @DisplayName("POST /verifyOtp/{email} - OTP không hợp lệ")
    void testVerifyOtp_InvalidOtp() throws Exception {
        // Arrange
        Integer otp = 999999;
        String email = "test@example.com";
        when(forgotPasswordService.verifyOtp(otp, email))
                .thenThrow(new RuntimeException("Invalid OTP for email " + email));

        // Act & Assert
        OtpRequest otpRequest = new OtpRequest("999999");
        mockMvc.perform(post("/api/forgot-password/verifyOtp/{email}", email)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(otpRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("❌ Mã OTP không đúng. Vui lòng kiểm tra lại."))
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.errorType").value("INVALID_OTP"));
    }

    @Test
    @DisplayName("POST /verifyOtp/{email} - OTP chứa ký tự không phải số")
    void testVerifyOtp_NonNumericOtp() throws Exception {
        // Act & Assert
        OtpRequest otpRequest = new OtpRequest("abc123");
        mockMvc.perform(post("/api/forgot-password/verifyOtp/{email}", "test@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(otpRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("❌ Mã OTP chỉ được chứa số. Vui lòng kiểm tra lại."))
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.errorType").value("INVALID_OTP_FORMAT"));
    }

    @Test
    @DisplayName("POST /verifyOtp/{email} - OTP không đủ 6 chữ số")
    void testVerifyOtp_InvalidOtpLength() throws Exception {
        // Act & Assert
        OtpRequest otpRequest = new OtpRequest("12345");
        mockMvc.perform(post("/api/forgot-password/verifyOtp/{email}", "test@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(otpRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("❌ Mã OTP phải có 6 chữ số. Vui lòng kiểm tra lại."))
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.errorType").value("INVALID_OTP_LENGTH"));
    }

    @Test
    @DisplayName("POST /verifyOtp/{email} - OTP rỗng")
    void testVerifyOtp_EmptyOtp() throws Exception {
        // Act & Assert
        OtpRequest otpRequest = new OtpRequest("");
        mockMvc.perform(post("/api/forgot-password/verifyOtp/{email}", "test@example.com")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(otpRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("❌ Vui lòng nhập mã OTP."))
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.errorType").value("MISSING_OTP"));
    }
} 