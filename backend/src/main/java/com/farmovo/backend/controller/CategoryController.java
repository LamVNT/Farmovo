package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;
import com.farmovo.backend.services.CategoryService;
import com.farmovo.backend.validator.CategoryValidator;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    @Autowired
    private CategoryService categoryService;

    @Autowired
    private CategoryValidator categoryValidator;

    @GetMapping
    public ResponseEntity<List<CategoryResponseDto>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllActiveCategories());
    }

    @PostMapping
    public ResponseEntity<CategoryResponseDto> createCategory(@Valid @RequestBody CategoryRequestDto request) {
        categoryValidator.validate(request);
        return ResponseEntity.ok(categoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryResponseDto> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequestDto request) {
        categoryValidator.validate(request);
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}