package com.farmovo.backend.specification;

import com.farmovo.backend.models.DebtNote;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class DebtNoteSpecification {

    public static Specification<DebtNote> isNotDeleted() {
        return (root, query, cb) -> cb.isNull(root.get("deletedAt"));
    }

    public static Specification<DebtNote> hasCustomer(Long customerId) {
        return (customerId == null) ? null : (root, query, cb) -> cb.equal(root.get("customer").get("id"), customerId);
    }

    public static Specification<DebtNote> hasStore(Long storeId) {
        return (storeId == null) ? null : (root, query, cb) -> cb.equal(root.get("store").get("id"), storeId);
    }

    public static Specification<DebtNote> hasFromSource(String fromSource) {
        return (fromSource == null || fromSource.isEmpty()) ? null : (root, query, cb) -> cb.equal(root.get("fromSource"), fromSource);
    }

    public static Specification<DebtNote> hasDebtType(String debtType) {
        return (debtType == null || debtType.isEmpty()) ? null : (root, query, cb) -> cb.equal(root.get("debtType"), debtType);
    }

    public static Specification<DebtNote> createdBetween(LocalDateTime from, LocalDateTime to) {
        if (from == null && to == null) return null;
        return (root, query, cb) -> {
            if (from != null && to != null) {
                // Bao gồm cả ngày bắt đầu và kết thúc
                return cb.between(root.get("debtDate"), from, to);
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("debtDate"), from);
            } else {
                return cb.lessThanOrEqualTo(root.get("debtDate"), to);
            }
        };
    }

    /**
     * Gom các điều kiện mặc định: chưa xóa và đúng customer.
     */
    public static Specification<DebtNote> defaultFilter(Long customerId) {
        return Specification.allOf(
                isNotDeleted(),
                hasCustomer(customerId)
        );
    }
} 