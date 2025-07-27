package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.exceptions.ValidationException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class CategoryValidator {

    public void validate(CategoryRequestDto dto) {
        if (!StringUtils.hasText(dto.getName())) {
            throw new ValidationException("Category name cannot be empty");
        }
        if (dto.getDescription() != null && dto.getDescription().length() > 255) {
            throw new ValidationException("Description cannot be longer than 255 characters");
        }
    }
}
