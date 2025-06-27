package com.farmovo.backend.validator;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class CategoryValidator {

    public void validate(CategoryRequestDto dto) {
        if (!StringUtils.hasText(dto.getName())) {
            throw new IllegalArgumentException("Category name cannot be empty");
        }
        if (dto.getDescription() != null && dto.getDescription().length() > 255) {
            throw new IllegalArgumentException("Description cannot be longer than 255 characters");
        }
    }
}
