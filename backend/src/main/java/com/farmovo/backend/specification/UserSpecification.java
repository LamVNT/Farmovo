package com.farmovo.backend.specification;

import com.farmovo.backend.models.User;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class UserSpecification {

    public static Specification<User> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<User> hasUsername(String username) {
        return (username == null || username.isBlank()) ? null :
                (root, query, cb) -> cb.like(cb.lower(root.get("username")), "%" + username.toLowerCase() + "%");
    }

    public static Specification<User> hasEmail(String email) {
        return (email == null || email.isBlank()) ? null :
                (root, query, cb) -> cb.like(cb.lower(root.get("email")), "%" + email.toLowerCase() + "%");
    }

    public static Specification<User> hasStatus(Boolean status) {
        return status == null ? null : (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<User> createdBetween(LocalDateTime from, LocalDateTime to) {
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