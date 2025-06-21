package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;
import com.farmovo.backend.exception.CategoryNotFoundException;
import com.farmovo.backend.mapper.CategoryMapper;
import com.farmovo.backend.models.Category;
import com.farmovo.backend.repositories.CategoryRepository;
import com.farmovo.backend.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {
    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public List<CategoryResponseDto> getAllActiveCategories() {
        return categoryRepository.findByDeleteAtIsNull()
                .stream()
                .map(categoryMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponseDto createCategory(CategoryRequestDto request) {
        Category category = categoryMapper.toEntity(request);
        category.setCreateAt(LocalDateTime.now());
        category.setCreateBy(1L); // Giả sử user ID là 1
        return categoryMapper.toResponseDto(categoryRepository.save(category));
    }

    @Override
    public CategoryResponseDto updateCategory(Long id, CategoryRequestDto request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setUpdateAt(LocalDateTime.now());
        return categoryMapper.toResponseDto(categoryRepository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException("Category not found with id: " + id));
        category.setDeleteAt(LocalDateTime.now());
        category.setDeleteBy(1L); // Giả sử user ID là 1
        categoryRepository.save(category);
    }
}