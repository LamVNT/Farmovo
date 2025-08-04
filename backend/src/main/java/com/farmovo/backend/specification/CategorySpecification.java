package com.farmovo.backend.specification;

import com.farmovo.backend.models.Category;
import org.springframework.data.jpa.domain.Specification;

public class CategorySpecification {
    public static Specification<Category> hasName(String name) {
        return (name == null || name.isBlank()) ? null :
                (root, query, cb) -> cb.like(cb.lower(root.get("categoryName")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<Category> hasDescription(String description) {
        return (description == null || description.isBlank()) ? null :
                (root, query, cb) -> cb.like(cb.lower(root.get("categoryDescription")), "%" + description.toLowerCase() + "%");
    }

    public static Specification<Category> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }
} 