package com.farmovo.backend.validator;

import com.farmovo.backend.models.ProductCategory;
import com.farmovo.backend.repositories.ProductCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CategoryValidator {
    @Autowired
    private ProductCategoryRepository repository;

    public void validateUniqueName(String name) {
        if (repository.existsByName(name)) {
            throw new IllegalArgumentException("Category name already exists: " + name);
        }
    }
}