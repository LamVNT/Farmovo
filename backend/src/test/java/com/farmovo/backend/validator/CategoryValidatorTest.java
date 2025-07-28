package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.exceptions.ValidationException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

class CategoryValidatorTest {
    private final CategoryValidator validator = new CategoryValidator();

    @Test
    void validate_withEmptyName_shouldThrow() {
        CategoryRequestDto dto = new CategoryRequestDto("", "desc");
        assertThatThrownBy(() -> validator.validate(dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Category name cannot be empty");
    }

    @Test
    void validate_withTooLongDescription_shouldThrow() {
        String longDesc = "a".repeat(256);
        CategoryRequestDto dto = new CategoryRequestDto("A", longDesc);
        assertThatThrownBy(() -> validator.validate(dto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Description cannot be longer than 255 characters");
    }

    @Test
    void validate_withValidInput_shouldNotThrow() {
        CategoryRequestDto dto = new CategoryRequestDto("A", "desc");
        assertThatCode(() -> validator.validate(dto)).doesNotThrowAnyException();
    }
} 