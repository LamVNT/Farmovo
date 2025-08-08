package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.SendLoginInfoRequestDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class InputUserValidationTest {

    @InjectMocks
    private InputUserValidation inputUserValidation;

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
    @DisplayName("validateEmail - Email hợp lệ")
    void testValidateEmail_ValidEmail() {
        // Given
        String validEmail = "test@example.com";

        // When & Then
        assertDoesNotThrow(() -> inputUserValidation.validateEmail(validEmail));
    }

    @Test
    @DisplayName("validateEmail - Email không hợp lệ")
    void testValidateEmail_InvalidEmail() {
        // Given
        String invalidEmail = "invalid-email";

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateEmail(invalidEmail));
        assertEquals("Invalid email format", exception.getMessage());
    }

    @Test
    @DisplayName("validateEmail - Email quá dài")
    void testValidateEmail_EmailTooLong() {
        // Given
        String longEmail = "a".repeat(250) + "@example.com";

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateEmail(longEmail));
        assertEquals("Email must not exceed 255 characters", exception.getMessage());
    }

    @Test
    @DisplayName("validateEmail - Email null")
    void testValidateEmail_NullEmail() {
        // When & Then
        assertDoesNotThrow(() -> inputUserValidation.validateEmail(null));
    }

    @Test
    @DisplayName("validateEmail - Email rỗng")
    void testValidateEmail_EmptyEmail() {
        // When & Then
        assertDoesNotThrow(() -> inputUserValidation.validateEmail(""));
    }

    @Test
    @DisplayName("validateEmail - Email chỉ có khoảng trắng")
    void testValidateEmail_WhitespaceEmail() {
        // When & Then
        assertDoesNotThrow(() -> inputUserValidation.validateEmail("   "));
    }

    @Test
    @DisplayName("validateEmailForCreate - Email hợp lệ")
    void testValidateEmailForCreate_ValidEmail() {
        // Given
        String validEmail = "test@example.com";

        // When & Then
        assertDoesNotThrow(() -> inputUserValidation.validateEmailForCreate(validEmail));
    }

    @Test
    @DisplayName("validateEmailForUpdate - Email hợp lệ")
    void testValidateEmailForUpdate_ValidEmail() {
        // Given
        String validEmail = "test@example.com";

        // When & Then
        assertDoesNotThrow(() -> inputUserValidation.validateEmailForUpdate(validEmail));
    }

    @Test
    @DisplayName("validateEmail - Các định dạng email hợp lệ khác nhau")
    void testValidateEmail_VariousValidFormats() {
        String[] validEmails = {
                "user@domain.com",
                "user.name@domain.com",
                "user+tag@domain.com",
                "user@domain.co.uk",
                "user@domain-name.com",
                "user123@domain.com",
                "user@domain123.com"
        };

        for (String email : validEmails) {
            assertDoesNotThrow(() -> inputUserValidation.validateEmail(email),
                    "Email should be valid: " + email);
        }
    }

    @Test
    @DisplayName("validateEmail - Các định dạng email không hợp lệ")
    void testValidateEmail_VariousInvalidFormats() {
        String[] invalidEmails = {
                "user@",
                "@domain.com",
                "user@domain",
                "user domain.com",
                "user@.com",
                "user@domain..com",
                "user@domain.com.",
                "user@domain_com"
        };

        for (String email : invalidEmails) {
            IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                    () -> inputUserValidation.validateEmail(email));
            assertEquals("Invalid email format", exception.getMessage(),
                    "Email should be invalid: " + email);
        }
    }

    @Test
    @DisplayName("validateSendLoginInfoRequest - Request hợp lệ")
    void testValidateSendLoginInfoRequest_ValidRequest() {
        // When & Then
        assertDoesNotThrow(() -> inputUserValidation.validateSendLoginInfoRequest(validRequest));
    }

    @Test
    @DisplayName("validateSendLoginInfoRequest - Request null")
    void testValidateSendLoginInfoRequest_NullRequest() {
        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateSendLoginInfoRequest(null));
        assertEquals("Request cannot be null", exception.getMessage());
    }

    @Test
    @DisplayName("validateSendLoginInfoRequest - Email null")
    void testValidateSendLoginInfoRequest_NullEmail() {
        // Given
        validRequest.setEmail(null);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateSendLoginInfoRequest(validRequest));
        assertEquals("Email không được để trống", exception.getMessage());
    }

    @Test
    @DisplayName("validateSendLoginInfoRequest - Email rỗng")
    void testValidateSendLoginInfoRequest_EmptyEmail() {
        // Given
        validRequest.setEmail("");

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateSendLoginInfoRequest(validRequest));
        assertEquals("Email không được để trống", exception.getMessage());
    }

    @Test
    @DisplayName("validateSendLoginInfoRequest - Username null")
    void testValidateSendLoginInfoRequest_NullUsername() {
        // Given
        validRequest.setUsername(null);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateSendLoginInfoRequest(validRequest));
        assertEquals("Username không được để trống", exception.getMessage());
    }

    @Test
    @DisplayName("validateSendLoginInfoRequest - Password null")
    void testValidateSendLoginInfoRequest_NullPassword() {
        // Given
        validRequest.setPassword(null);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateSendLoginInfoRequest(validRequest));
        assertEquals("Password không được để trống", exception.getMessage());
    }

    @Test
    @DisplayName("validateSendLoginInfoRequest - FullName null")
    void testValidateSendLoginInfoRequest_NullFullName() {
        // Given
        validRequest.setFullName(null);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateSendLoginInfoRequest(validRequest));
        assertEquals("Full name không được để trống", exception.getMessage());
    }

    @Test
    @DisplayName("validateSendLoginInfoRequest - StoreName null")
    void testValidateSendLoginInfoRequest_NullStoreName() {
        // Given
        validRequest.setStoreName(null);

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> inputUserValidation.validateSendLoginInfoRequest(validRequest));
        assertEquals("Store name không được để trống", exception.getMessage());
    }
}
