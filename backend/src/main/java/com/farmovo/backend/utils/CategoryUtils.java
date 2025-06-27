package com.farmovo.backend.utils;

import com.farmovo.backend.models.Category;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CategoryUtils {
    public List<Category> filterActiveCategories(List<Category> categories) {
        return categories.stream()
                .filter(category -> category.getUpdatedAt() == null)
                .collect(Collectors.toList());
    }
}