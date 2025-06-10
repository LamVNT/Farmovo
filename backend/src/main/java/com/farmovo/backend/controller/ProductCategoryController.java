package com.farmovo.backend.controller;

import com.farmovo.backend.models.ProductCategory;
import com.farmovo.backend.services.ProductCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-categories")
public class ProductCategoryController {
    @Autowired
    private ProductCategoryService service;

    @GetMapping
    public ResponseEntity<List<ProductCategory>> getAllCategories() {
        return new ResponseEntity<>(service.getAllCategories(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductCategory> getCategoryById(@PathVariable Long id) {
        return service.getCategoryById(id)
                .map(category -> new ResponseEntity<>(category, HttpStatus.OK))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping
    public ResponseEntity<ProductCategory> createCategory(
            @RequestBody ProductCategory category,
            @RequestHeader("X-Created-By") Long createdBy) {
        ProductCategory savedCategory = service.createCategory(category, createdBy);
        return new ResponseEntity<>(savedCategory, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductCategory> updateCategory(
            @PathVariable Long id,
            @RequestBody ProductCategory category,
            @RequestHeader("X-Updated-By") Long updatedBy) {
        try {
            ProductCategory updatedCategory = service.updateCategory(id, category, updatedBy);
            return new ResponseEntity<>(updatedCategory, HttpStatus.OK);
        } catch (RuntimeException e) {
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
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
}