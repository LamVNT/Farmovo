package com.farmovo.backend.specification;

import com.farmovo.backend.models.DebtNote;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.math.BigDecimal;

public class DebtNoteSpecification {

    public static Specification<DebtNote> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<DebtNote> hasCustomerId(Long customerId) {
        if (customerId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<DebtNote> hasStoreId(Long storeId) {
        if (storeId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("store").get("id"), storeId);
    }

    public static Specification<DebtNote> hasDebtType(String debtType) {
        if (debtType == null || debtType.trim().isEmpty()) return null;
        return (root, query, cb) -> cb.equal(root.get("debtType"), debtType);
    }

    public static Specification<DebtNote> hasFromSource(String fromSource) {
        if (fromSource == null || fromSource.trim().isEmpty()) return null;
        return (root, query, cb) -> cb.equal(root.get("fromSource"), fromSource);
    }

    public static Specification<DebtNote> hasSourceId(Long sourceId) {
        if (sourceId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("sourceId"), sourceId);
    }

    public static Specification<DebtNote> debtDescriptionLike(String description) {
        if (description == null || description.trim().isEmpty()) return null;
        return (root, query, cb) -> cb.like(
            cb.lower(root.get("debtDescription")),
            "%" + description.toLowerCase() + "%"
        );
    }

    public static Specification<DebtNote> debtAmountBetween(BigDecimal minAmount, BigDecimal maxAmount) {
        if (minAmount == null && maxAmount == null) return null;
        return (root, query, cb) -> {
            if (minAmount != null && maxAmount != null) {
                return cb.between(root.get("debtAmount"), minAmount, maxAmount);
            } else if (minAmount != null) {
                return cb.greaterThanOrEqualTo(root.get("debtAmount"), minAmount);
            } else {
                return cb.lessThanOrEqualTo(root.get("debtAmount"), maxAmount);
            }
        };
    }

    public static Specification<DebtNote> debtDateBetween(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate == null && toDate == null) return null;
        return (root, query, cb) -> {
            if (fromDate != null && toDate != null) {
                return cb.between(root.get("debtDate"), fromDate, toDate);
            } else if (fromDate != null) {
                return cb.greaterThanOrEqualTo(root.get("debtDate"), fromDate);
            } else {
                return cb.lessThanOrEqualTo(root.get("debtDate"), toDate);
            }
        };
    }

    public static Specification<DebtNote> hasCustomerName(String customerName) {
        if (customerName == null || customerName.trim().isEmpty()) return null;
        return (root, query, cb) -> cb.like(
            cb.lower(root.get("customer").get("name")),
            "%" + customerName.trim().toLowerCase() + "%"
        );
    }

    public static Specification<DebtNote> hasStoreName(String storeName) {
        if (storeName == null || storeName.trim().isEmpty()) return null;
        return (root, query, cb) -> cb.like(
            cb.lower(root.get("store").get("name")),
            "%" + storeName.trim().toLowerCase() + "%"
        );
    }

    public static Specification<DebtNote> createdBy(Long createdBy) {
        if (createdBy == null) return null;
        return (root, query, cb) -> cb.equal(root.get("createdBy"), createdBy);
    }

    public static Specification<DebtNote> hasEvidence(Boolean hasEvidence) {
        if (hasEvidence == null) return null;
        return (root, query, cb) -> {
            if (hasEvidence) {
                return cb.isNotNull(root.get("debtEvidences"));
            } else {
                return cb.isNull(root.get("debtEvidences"));
            }
        };
    }

    public static Specification<DebtNote> hasEvidenceLike(String evidence) {
        if (evidence == null || evidence.trim().isEmpty()) return null;
        return (root, query, cb) -> cb.like(
            cb.lower(root.get("debtEvidences")),
            "%" + evidence.trim().toLowerCase() + "%"
        );
    }
} 