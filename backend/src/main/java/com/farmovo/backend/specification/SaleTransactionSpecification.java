package com.farmovo.backend.specification;

import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.SaleTransactionStatus;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SaleTransactionSpecification {

    public static Specification<SaleTransaction> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<SaleTransaction> hasName(String name) {
        return (root, query, cb) -> {
            if (name == null || name.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
        };
    }

    public static Specification<SaleTransaction> hasCustomerName(String customerName) {
        return (root, query, cb) -> {
            if (customerName == null || customerName.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("customer").get("name")), "%" + customerName.toLowerCase() + "%");
        };
    }

    public static Specification<SaleTransaction> hasStoreName(String storeName) {
        return (root, query, cb) -> {
            if (storeName == null || storeName.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("store").get("storeName")), "%" + storeName.toLowerCase() + "%");
        };
    }

    public static Specification<SaleTransaction> hasStatus(SaleTransactionStatus status) {
        return (root, query, cb) -> {
            if (status == null) return cb.conjunction();
            return cb.equal(root.get("status"), status);
        };
    }

    public static Specification<SaleTransaction> hasSaleDateBetween(LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            if (from == null && to == null) return cb.conjunction();
            if (from != null && to != null) {
                return cb.between(root.get("saleDate"), from, to);
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("saleDate"), from);
            } else {
                return cb.lessThanOrEqualTo(root.get("saleDate"), to);
            }
        };
    }

    public static Specification<SaleTransaction> hasTotalAmountBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) return cb.conjunction();
            if (min != null && max != null) {
                return cb.between(root.get("totalAmount"), min, max);
            } else if (min != null) {
                return cb.greaterThanOrEqualTo(root.get("totalAmount"), min);
            } else {
                return cb.lessThanOrEqualTo(root.get("totalAmount"), max);
            }
        };
    }

    public static Specification<SaleTransaction> hasPaidAmountBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) return cb.conjunction();
            if (min != null && max != null) {
                return cb.between(root.get("paidAmount"), min, max);
            } else if (min != null) {
                return cb.greaterThanOrEqualTo(root.get("paidAmount"), min);
            } else {
                return cb.lessThanOrEqualTo(root.get("paidAmount"), max);
            }
        };
    }

    public static Specification<SaleTransaction> hasNote(String note) {
        return (root, query, cb) -> {
            if (note == null || note.isBlank()) return cb.conjunction();
            return cb.like(cb.lower(root.get("saleTransactionNote")), "%" + note.toLowerCase() + "%");
        };
    }

    public static Specification<SaleTransaction> hasCreatedBy(Long userId) {
        return (root, query, cb) -> {
            if (userId == null) return cb.conjunction();
            return cb.equal(root.get("createdBy"), userId);
        };
    }
}


