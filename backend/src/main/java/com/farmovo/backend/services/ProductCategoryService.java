package com.farmovo.backend.services;

import com.farmovo.backend.models.ProductCategory;

import java.util.List;
import java.util.Optional;

public interface ProductCategoryService {
    List<ProductCategory> getAllCategories();

    Optional<ProductCategory> getCategoryById(Long id);

    ProductCategory createCategory(ProductCategory category, Long createdBy);

    ProductCategory updateCategory(Long id, ProductCategory category, Long updatedBy);

    void deleteCategory(Long id, Long deletedBy);
}