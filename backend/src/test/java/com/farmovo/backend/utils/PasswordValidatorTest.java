package com.farmovo.backend.utils;

import com.farmovo.backend.validator.PasswordValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PasswordValidatorTest {

    @Test
    @DisplayName("validatePassword - Mật khẩu hợp lệ")
    void testValidatePassword_ValidPassword() {
        String validPassword = "StrongP@ss123";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(validPassword);
        
        assertTrue(result.isValid());
        assertTrue(result.getErrors().isEmpty());
    }

    @Test
    @DisplayName("validatePassword - Mật khẩu quá ngắn")
    void testValidatePassword_TooShort() {
        String shortPassword = "Abc1!";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(shortPassword);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu phải có ít nhất 8 ký tự"));
    }

    @Test
    @DisplayName("validatePassword - Mật khẩu quá dài")
    void testValidatePassword_TooLong() {
        String longPassword = "A".repeat(65) + "b1!";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(longPassword);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu không được vượt quá 64 ký tự"));
    }

    @Test
    @DisplayName("validatePassword - Thiếu chữ hoa")
    void testValidatePassword_NoUppercase() {
        String password = "strongpass123!";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(password);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu phải chứa ít nhất 1 chữ hoa"));
    }

    @Test
    @DisplayName("validatePassword - Thiếu chữ thường")
    void testValidatePassword_NoLowercase() {
        String password = "STRONGPASS123!";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(password);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu phải chứa ít nhất 1 chữ thường"));
    }

    @Test
    @DisplayName("validatePassword - Thiếu số")
    void testValidatePassword_NoDigit() {
        String password = "StrongPass!";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(password);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu phải chứa ít nhất 1 số"));
    }

    @Test
    @DisplayName("validatePassword - Thiếu ký tự đặc biệt")
    void testValidatePassword_NoSpecialChar() {
        String password = "StrongPass123";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(password);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt"));
    }

    @Test
    @DisplayName("validatePassword - Mật khẩu yếu (password)")
    void testValidatePassword_WeakPassword() {
        String weakPassword = "password";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(weakPassword);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu quá đơn giản, vui lòng chọn mật khẩu mạnh hơn"));
    }

    @Test
    @DisplayName("validatePassword - Ký tự liên tiếp (abc)")
    void testValidatePassword_SequentialCharacters() {
        String password = "StrongAbc123!";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(password);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu không được chứa các ký tự liên tiếp"));
    }

    @Test
    @DisplayName("validatePassword - Ký tự lặp lại (aaa)")
    void testValidatePassword_RepeatedCharacters() {
        String password = "StrongAaa123!";
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(password);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu không được chứa các ký tự lặp lại liên tiếp"));
    }

    @Test
    @DisplayName("validatePassword - Mật khẩu null")
    void testValidatePassword_NullPassword() {
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(null);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu không được để trống"));
    }

    @Test
    @DisplayName("validatePassword - Mật khẩu rỗng")
    void testValidatePassword_EmptyPassword() {
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword("");
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu không được để trống"));
    }

    @Test
    @DisplayName("validatePassword - Mật khẩu chỉ có khoảng trắng")
    void testValidatePassword_BlankPassword() {
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword("   ");
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("Mật khẩu không được để trống"));
    }

    @Test
    @DisplayName("validatePasswordOrThrow - Mật khẩu hợp lệ")
    void testValidatePasswordOrThrow_ValidPassword() {
        String validPassword = "StrongP@ss123";
        
        // Should not throw exception
        assertDoesNotThrow(() -> PasswordValidator.validatePasswordOrThrow(validPassword));
    }

    @Test
    @DisplayName("validatePasswordOrThrow - Mật khẩu không hợp lệ")
    void testValidatePasswordOrThrow_InvalidPassword() {
        String invalidPassword = "weak";
        
        // Should throw IllegalArgumentException
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> PasswordValidator.validatePasswordOrThrow(invalidPassword));
        
        assertTrue(exception.getMessage().contains("Password validation failed"));
    }

    @Test
    @DisplayName("validatePassword - Nhiều lỗi cùng lúc")
    void testValidatePassword_MultipleErrors() {
        String badPassword = "abc"; // quá ngắn, thiếu chữ hoa, số, ký tự đặc biệt
        PasswordValidator.PasswordValidationResult result = PasswordValidator.validatePassword(badPassword);
        
        assertFalse(result.isValid());
        assertTrue(result.getErrors().size() > 1);
        assertTrue(result.getErrors().contains("Mật khẩu phải có ít nhất 8 ký tự"));
        assertTrue(result.getErrors().contains("Mật khẩu phải chứa ít nhất 1 chữ hoa"));
        assertTrue(result.getErrors().contains("Mật khẩu phải chứa ít nhất 1 số"));
        assertTrue(result.getErrors().contains("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt"));
    }
} 