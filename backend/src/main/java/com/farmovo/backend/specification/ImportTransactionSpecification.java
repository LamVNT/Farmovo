package com.farmovo.backend.specification;

import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.ImportTransactionStatus;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ImportTransactionSpecification {

    public static Specification<ImportTransaction> isNotDeleted() {
        return (root, query, cb) ->
                cb.and(cb.isNull(root.get("deletedAt")), cb.isNull(root.get("deletedBy")));
    }

    public static Specification<ImportTransaction> hasName(String name) {
        if (name == null || name.isBlank()) return null;
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%");
    }

    public static Specification<ImportTransaction> hasSupplierName(String supplierName) {
        if (supplierName == null || supplierName.isBlank()) return null;
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("supplier").get("name")), "%" + supplierName.toLowerCase() + "%");
    }

    public static Specification<ImportTransaction> hasStore(Long storeId) {
        if (storeId == null) return null;
        return (root, query, cb) ->
                cb.equal(root.get("store").get("id"), storeId);
    }

    public static Specification<ImportTransaction> hasStaff(Long staffId) {
        if (staffId == null) return null;
        return (root, query, cb) ->
                cb.equal(root.get("staff").get("id"), staffId);
    }

    public static Specification<ImportTransaction> hasStatus(ImportTransactionStatus status) {
        if (status == null) return null;
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<ImportTransaction> createdBetween(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate == null && toDate == null) return null;

        return (root, query, cb) -> {
            if (fromDate != null && toDate != null) {
                return cb.between(
                        root.get("importDate"),
                        fromDate,
                        toDate
                );
            } else if (fromDate != null) {
                return cb.greaterThanOrEqualTo(root.get("importDate"), fromDate);
            } else {
                return cb.lessThanOrEqualTo(root.get("importDate"), toDate);
            }
        };
    }


    public static Specification<ImportTransaction> hasTotalAmountBetween(BigDecimal min, BigDecimal max) {
        if (min == null && max == null) return null;
        return (root, query, cb) -> {
            if (min != null && max != null) {
                return cb.between(root.get("totalAmount"), min, max);
            } else if (min != null) {
                return cb.greaterThanOrEqualTo(root.get("totalAmount"), min);
            } else {
                return cb.lessThanOrEqualTo(root.get("totalAmount"), max);
            }
        };
    }

    public static Specification<ImportTransaction> buildSpecification(
            String name,
            String supplierName,
            Long storeId,
            Long staffId,
            ImportTransactionStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            BigDecimal minTotalAmount,
            BigDecimal maxTotalAmount) {

        return Specification.allOf(
                isNotDeleted(),
                hasName(name),
                hasSupplierName(supplierName),
                hasStore(storeId),
                hasStaff(staffId),
                hasStatus(status),
                createdBetween(fromDate, toDate),
                hasTotalAmountBetween(minTotalAmount, maxTotalAmount)
        );
    }


}
