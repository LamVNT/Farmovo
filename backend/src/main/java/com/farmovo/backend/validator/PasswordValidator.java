package com.farmovo.backend.validator;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Utility class for password validation
 */
public class PasswordValidator {
    
    // Minimum length requirement
    private static final int MIN_LENGTH = 8;
    
    // Maximum length requirement
    private static final int MAX_LENGTH = 64;
    
    // Regex patterns for different character types
    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("\\d");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?]");
    
    /**
     * Validates password strength and returns validation result
     * @param password the password to validate
     * @return PasswordValidationResult containing validation status and errors
     */
    public static PasswordValidationResult validatePassword(String password) {
        List<String> errors = new ArrayList<>();
        
        // Check if password is null or empty
        if (password == null || password.trim().isEmpty()) {
            errors.add("Mật khẩu không được để trống");
            return new PasswordValidationResult(false, errors);
        }
        
        // Check length
        if (password.length() < MIN_LENGTH) {
            errors.add("Mật khẩu phải có ít nhất " + MIN_LENGTH + " ký tự");
        }
        
        if (password.length() > MAX_LENGTH) {
            errors.add("Mật khẩu không được vượt quá " + MAX_LENGTH + " ký tự");
        }
        
        // Check for uppercase letters
        if (!UPPERCASE_PATTERN.matcher(password).find()) {
            errors.add("Mật khẩu phải chứa ít nhất 1 chữ hoa");
        }
        
        // Check for lowercase letters
        if (!LOWERCASE_PATTERN.matcher(password).find()) {
            errors.add("Mật khẩu phải chứa ít nhất 1 chữ thường");
        }
        
        // Check for digits
        if (!DIGIT_PATTERN.matcher(password).find()) {
            errors.add("Mật khẩu phải chứa ít nhất 1 số");
        }
        
        // Check for special characters
        if (!SPECIAL_CHAR_PATTERN.matcher(password).find()) {
            errors.add("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*()_+-=[]{}|;:,.<>?)");
        }
        
        // Check for common weak passwords
        if (isCommonWeakPassword(password)) {
            errors.add("Mật khẩu quá đơn giản, vui lòng chọn mật khẩu mạnh hơn");
        }
        
        // Check for sequential characters
        if (hasSequentialCharacters(password)) {
            errors.add("Mật khẩu không được chứa các ký tự liên tiếp (abc, 123, etc.)");
        }
        
        // Check for repeated characters
        if (hasRepeatedCharacters(password)) {
            errors.add("Mật khẩu không được chứa các ký tự lặp lại liên tiếp (aaa, 111, etc.)");
        }
        
        return new PasswordValidationResult(errors.isEmpty(), errors);
    }
    
    /**
     * Quick validation method that throws exception if password is invalid
     * @param password the password to validate
     * @throws IllegalArgumentException if password is invalid
     */
    public static void validatePasswordOrThrow(String password) {
        PasswordValidationResult result = validatePassword(password);
        if (!result.isValid()) {
            throw new IllegalArgumentException("Password validation failed: " + String.join(", ", result.getErrors()));
        }
    }
    
    /**
     * Checks if password is a common weak password
     */
    private static boolean isCommonWeakPassword(String password) {
        String[] weakPasswords = {
            "password", "123456", "12345678", "qwerty", "abc123", "password123",
            "admin", "user", "test", "guest", "welcome", "letmein", "monkey",
            "dragon", "master", "hello", "freedom", "whatever", "qwerty123",
            "trustno1", "jordan", "harley", "ranger", "iwantu", "jennifer",
            "hunter", "buster", "soccer", "baseball", "tequiero", "princess",
            "maggie", "coffee", "solo", "mike", "killer", "love", "secret",
            "summer", "tiger", "friend", "chelsea", "black", "diamond",
            "nascar", "jackson", "cameron", "654321", "computer", "amanda",
            "wizard", "xxxxxxxx", "money", "phoenix", "mickey", "bailey",
            "knight", "iceman", "tigers", "purple", "andrea", "horsey",
            "dakota", "aaaaaa", "player", "sunshine", "morgan", "starwars",
            "boomer", "cowboys", "edward", "charles", "girls", "booboo",
            "coffee", "bulldog", "ncc1701", "rabbit", "peanut", "johnson",
            "hunter", "blowme", "2000", "shadow", "melissa", "explorer"
        };
        
        String lowerPassword = password.toLowerCase();
        for (String weak : weakPasswords) {
            if (lowerPassword.equals(weak)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Checks if password contains sequential characters
     */
    private static boolean hasSequentialCharacters(String password) {
        String lowerPassword = password.toLowerCase();
        
        // Check for sequential letters (abc, bcd, etc.)
        for (int i = 0; i < lowerPassword.length() - 2; i++) {
            char c1 = lowerPassword.charAt(i);
            char c2 = lowerPassword.charAt(i + 1);
            char c3 = lowerPassword.charAt(i + 2);
            
            if (Character.isLetter(c1) && Character.isLetter(c2) && Character.isLetter(c3)) {
                if (c2 == c1 + 1 && c3 == c2 + 1) {
                    return true;
                }
            }
        }
        
        // Check for sequential numbers (123, 234, etc.)
        for (int i = 0; i < lowerPassword.length() - 2; i++) {
            char c1 = lowerPassword.charAt(i);
            char c2 = lowerPassword.charAt(i + 1);
            char c3 = lowerPassword.charAt(i + 2);
            
            if (Character.isDigit(c1) && Character.isDigit(c2) && Character.isDigit(c3)) {
                if (c2 == c1 + 1 && c3 == c2 + 1) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Checks if password contains repeated characters
     */
    private static boolean hasRepeatedCharacters(String password) {
        for (int i = 0; i < password.length() - 2; i++) {
            char c1 = password.charAt(i);
            char c2 = password.charAt(i + 1);
            char c3 = password.charAt(i + 2);
            
            if (c1 == c2 && c2 == c3) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Result class for password validation
     */
    public static class PasswordValidationResult {
        private final boolean valid;
        private final List<String> errors;
        
        public PasswordValidationResult(boolean valid, List<String> errors) {
            this.valid = valid;
            this.errors = errors;
        }
        
        public boolean isValid() {
            return valid;
        }
        
        public List<String> getErrors() {
            return errors;
        }
        
        public String getErrorMessage() {
            return String.join(", ", errors);
        }
    }
} 