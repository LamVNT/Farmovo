package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.SendLoginInfoRequestDto;
import com.farmovo.backend.validator.InputUserValidation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceImplTest {

    @Mock
    private JavaMailSender javaMailSender;

    @Mock
    private InputUserValidation inputUserValidation;

    @InjectMocks
    private EmailServiceImpl emailService;

    private SendLoginInfoRequestDto validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new SendLoginInfoRequestDto();
        validRequest.setEmail("test@example.com");
        validRequest.setUsername("testuser");
        validRequest.setPassword("TestPass123!");
        validRequest.setFullName("Test User");
        validRequest.setStoreName("Test Store");
    }

    @Test
    @DisplayName("sendLoginInfoEmail - Gửi email thành công")
    void testSendLoginInfoEmail_Success() {
        // Given
        doNothing().when(inputUserValidation).validateSendLoginInfoRequest(any(SendLoginInfoRequestDto.class));
        doNothing().when(javaMailSender).send(any(org.springframework.mail.SimpleMailMessage.class));

        // When & Then
        assertDoesNotThrow(() -> emailService.sendLoginInfoEmail(validRequest));
        verify(inputUserValidation, times(1)).validateSendLoginInfoRequest(validRequest);
        verify(javaMailSender, times(1)).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    @DisplayName("sendLoginInfoEmail - Validation thất bại")
    void testSendLoginInfoEmail_ValidationFails() {
        // Given
        String errorMessage = "Email không được để trống";
        doThrow(new IllegalArgumentException(errorMessage))
                .when(inputUserValidation).validateSendLoginInfoRequest(any(SendLoginInfoRequestDto.class));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> emailService.sendLoginInfoEmail(validRequest));
        assertTrue(exception.getMessage().contains("Không thể gửi email thông tin đăng nhập"));
        assertTrue(exception.getMessage().contains(errorMessage));
        verify(javaMailSender, never()).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    @DisplayName("sendLoginInfoEmail - SMTP lỗi")
    void testSendLoginInfoEmail_SmtpError() {
        // Given
        doNothing().when(inputUserValidation).validateSendLoginInfoRequest(any(SendLoginInfoRequestDto.class));
        String errorMessage = "SMTP connection failed";
        doThrow(new RuntimeException(errorMessage)).when(javaMailSender).send(any(org.springframework.mail.SimpleMailMessage.class));

        // When & Then
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> emailService.sendLoginInfoEmail(validRequest));
        assertTrue(exception.getMessage().contains("Không thể gửi email thông tin đăng nhập"));
        assertTrue(exception.getMessage().contains(errorMessage));
    }

    @Test
    @DisplayName("sendLoginInfoEmail - Request null")
    void testSendLoginInfoEmail_NullRequest() {
        // When & Then
        assertThrows(NullPointerException.class,
                () -> emailService.sendLoginInfoEmail(null));
    }
}
