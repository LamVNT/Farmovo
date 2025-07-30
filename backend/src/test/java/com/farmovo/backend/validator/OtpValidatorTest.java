package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.OtpRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OtpValidatorTest {

    private OtpValidator otpValidator;

    @BeforeEach
    void setUp() {
        otpValidator = new OtpValidator();
    }

    @Test
    @DisplayName("Validate OTP - Valid OTP")
    void testValidateOtp_ValidOtp() {
        // Arrange
        OtpRequest request = new OtpRequest("123456");

        // Act
        OtpValidator.ValidationResult result = otpValidator.validateOtp(request);

        // Assert
        assertTrue(result.isValid());
        assertNull(result.getErrorType());
        assertNull(result.getErrorMessage());
    }

    @Test
    @DisplayName("Validate OTP - Null OTP")
    void testValidateOtp_NullOtp() {
        // Arrange
        OtpRequest request = new OtpRequest(null);

        // Act
        OtpValidator.ValidationResult result = otpValidator.validateOtp(request);

        // Assert
        assertFalse(result.isValid());
        assertEquals("MISSING_OTP", result.getErrorType());
        assertEquals("❌ Vui lòng nhập mã OTP.", result.getErrorMessage());
    }

    @Test
    @DisplayName("Validate OTP - Empty OTP")
    void testValidateOtp_EmptyOtp() {
        // Arrange
        OtpRequest request = new OtpRequest("");

        // Act
        OtpValidator.ValidationResult result = otpValidator.validateOtp(request);

        // Assert
        assertFalse(result.isValid());
        assertEquals("MISSING_OTP", result.getErrorType());
        assertEquals("❌ Vui lòng nhập mã OTP.", result.getErrorMessage());
    }

    @Test
    @DisplayName("Validate OTP - Non-numeric OTP")
    void testValidateOtp_NonNumericOtp() {
        // Arrange
        OtpRequest request = new OtpRequest("abc123");

        // Act
        OtpValidator.ValidationResult result = otpValidator.validateOtp(request);

        // Assert
        assertFalse(result.isValid());
        assertEquals("INVALID_OTP_FORMAT", result.getErrorType());
        assertEquals("❌ Mã OTP chỉ được chứa số. Vui lòng kiểm tra lại.", result.getErrorMessage());
    }

    @Test
    @DisplayName("Validate OTP - Invalid length (5 digits)")
    void testValidateOtp_InvalidLength5Digits() {
        // Arrange
        OtpRequest request = new OtpRequest("12345");

        // Act
        OtpValidator.ValidationResult result = otpValidator.validateOtp(request);

        // Assert
        assertFalse(result.isValid());
        assertEquals("INVALID_OTP_LENGTH", result.getErrorType());
        assertEquals("❌ Mã OTP phải có 6 chữ số. Vui lòng kiểm tra lại.", result.getErrorMessage());
    }

    @Test
    @DisplayName("Validate OTP - Invalid length (7 digits)")
    void testValidateOtp_InvalidLength7Digits() {
        // Arrange
        OtpRequest request = new OtpRequest("1234567");

        // Act
        OtpValidator.ValidationResult result = otpValidator.validateOtp(request);

        // Assert
        assertFalse(result.isValid());
        assertEquals("INVALID_OTP_LENGTH", result.getErrorType());
        assertEquals("❌ Mã OTP phải có 6 chữ số. Vui lòng kiểm tra lại.", result.getErrorMessage());
    }

    @Test
    @DisplayName("Validate OTP - Whitespace only")
    void testValidateOtp_WhitespaceOnly() {
        // Arrange
        OtpRequest request = new OtpRequest("   ");

        // Act
        OtpValidator.ValidationResult result = otpValidator.validateOtp(request);

        // Assert
        assertFalse(result.isValid());
        assertEquals("MISSING_OTP", result.getErrorType());
        assertEquals("❌ Vui lòng nhập mã OTP.", result.getErrorMessage());
    }
} 