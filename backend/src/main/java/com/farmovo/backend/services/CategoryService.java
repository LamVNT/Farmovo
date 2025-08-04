package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CategoryService {
    List<CategoryResponseDto> getAllActiveCategories();

    CategoryResponseDto createCategory(CategoryRequestDto request);

    CategoryResponseDto updateCategory(Long id, CategoryRequestDto request);

    void deleteCategory(Long id);

    Page<CategoryResponseDto> searchCategories(String name, String description, Pageable pageable);
}