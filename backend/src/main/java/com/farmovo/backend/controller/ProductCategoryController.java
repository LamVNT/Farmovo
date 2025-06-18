package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.ProductCategoryRequest;
import com.farmovo.backend.dto.response.ProductCategoryResponse;
import com.farmovo.backend.exception.ProductCategoryNotFoundException;
import com.farmovo.backend.mapper.ProductCategoryMapper;
import com.farmovo.backend.models.ProductCategory;
import com.farmovo.backend.services.ProductCategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/product-categories")
public class ProductCategoryController {
    @Autowired
    private ProductCategoryService service;
    @Autowired
    private ProductCategoryMapper mapper;

    @GetMapping
    public ResponseEntity<List<ProductCategoryResponse>> getAllCategories() {
        List<ProductCategoryResponse> responses = service.getAllCategories().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
        return new ResponseEntity<>(responses, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductCategoryResponse> getCategoryById(@PathVariable Long id) {
        return service.getCategoryById(id)
                .map(category -> new ResponseEntity<>(mapper.toResponse(category), HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<ProductCategoryResponse> createCategory(
            @Valid @RequestBody ProductCategoryRequest request,
            @RequestHeader("X-Created-By") Long createdBy) {
        ProductCategory category = mapper.toEntity(request);
        ProductCategory savedCategory = service.createCategory(category, createdBy);
        return new ResponseEntity<>(mapper.toResponse(savedCategory), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductCategoryResponse> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody ProductCategoryRequest request,
            @RequestHeader("X-Updated-By") Long updatedBy) {
        ProductCategory category = mapper.toEntity(request);
        try {
            ProductCategory updatedCategory = service.updateCategory(id, category, updatedBy);
            return new ResponseEntity<>(mapper.toResponse(updatedCategory), HttpStatus.OK);
        } catch (ProductCategoryNotFoundException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id,
            @RequestHeader("X-Deleted-By") Long deletedBy) {
        try {
            service.deleteCategory(id, deletedBy);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (ProductCategoryNotFoundException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}