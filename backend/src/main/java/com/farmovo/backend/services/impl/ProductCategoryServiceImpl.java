package com.farmovo.backend.services.impl;

import com.farmovo.backend.models.ProductCategory;
import com.farmovo.backend.repositories.ProductCategoryRepository;
import com.farmovo.backend.services.ProductCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ProductCategoryServiceImpl implements ProductCategoryService {
    @Autowired
    private ProductCategoryRepository repository;

    @Override
    public List<ProductCategory> getAllCategories() {
        return repository.findAll();
    }

    @Override
    public Optional<ProductCategory> getCategoryById(Long id) {
        return repository.findById(id);
    }

    @Override
    public ProductCategory createCategory(ProductCategory category, Long createdBy) {
        category.setCreatedBy(createdBy);
        category.setCreatedAt(LocalDateTime.now());
        return repository.save(category);
    }

    @Override
    public ProductCategory updateCategory(Long id, ProductCategory category, Long updatedBy) {
        category.setId(id);
        category.setUpdatedAt(LocalDateTime.now());
        category.setUpdatedBy(updatedBy);
        return repository.save(category);
    }

    @Override
    public void deleteCategory(Long id, Long deletedBy) {
        ProductCategory category = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setDeletedAt(LocalDateTime.now());
        category.setDeletedBy(deletedBy);
        repository.save(category); // Soft delete
    }
}