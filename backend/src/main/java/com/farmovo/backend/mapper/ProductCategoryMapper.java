package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.ProductCategoryRequest;
import com.farmovo.backend.dto.response.ProductCategoryResponse;
import com.farmovo.backend.models.ProductCategory;
import org.springframework.stereotype.Component;

@Component
public class ProductCategoryMapper {
    public ProductCategory toEntity(ProductCategoryRequest request) {
        ProductCategory category = new ProductCategory();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setCreatedBy(request.getCreatedBy());
        return category;
    }

    public ProductCategoryResponse toResponse(ProductCategory entity) {
        ProductCategoryResponse response = new ProductCategoryResponse();
        response.setId(entity.getId());
        response.setName(entity.getName());
        response.setDescription(entity.getDescription());
        return response;
    }
}