package com.farmovo.backend.specification;

import com.farmovo.backend.models.Customer;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;

public class CustomerSpecification {

    public static Specification<Customer> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<Customer> hasName(String keyword) {
        return (keyword == null || keyword.isBlank()) ? null :
                (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%");
    }

    public static Specification<Customer> hasPhone(String phone) {
        return (phone == null || phone.isBlank()) ? null :
                (root, query, cb) -> cb.like(root.get("phone"), "%" + phone + "%");
    }

    public static Specification<Customer> hasEmail(String email) {
        return (email == null || email.isBlank()) ? null :
                (root, query, cb) -> cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%");
    }

    public static Specification<Customer> createdBetween(LocalDateTime from, LocalDateTime to) {
        if (from == null && to == null) return null;
        return (root, query, cb) -> {
            if (from != null && to != null) {
                return cb.between(root.get("createdAt"), from, to);
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("createdAt"), from);
            } else {
                return cb.lessThanOrEqualTo(root.get("createdAt"), to);
            }
        };
    }
} 