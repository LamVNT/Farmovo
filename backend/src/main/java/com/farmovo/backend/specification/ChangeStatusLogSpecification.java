package com.farmovo.backend.specification;

import com.farmovo.backend.dto.request.ChangeStatusLogFilterRequestDTO;
import com.farmovo.backend.models.ChangeStatusLog;
import org.springframework.data.jpa.domain.Specification;
import java.time.LocalDateTime;

public class ChangeStatusLogSpecification {

    public static Specification<ChangeStatusLog> hasModelName(String modelName) {
        if (modelName == null || modelName.isBlank()) return null;
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("modelName")), "%" + modelName.toLowerCase() + "%");
    }

    public static Specification<ChangeStatusLog> hasModelId(Long modelId) {
        if (modelId == null) return null;
        return (root, query, cb) ->
                cb.equal(root.get("modelID"), modelId);
    }

    public static Specification<ChangeStatusLog> hasPreviousStatus(String previousStatus) {
        if (previousStatus == null || previousStatus.isBlank()) return null;
        return (root, query, cb) ->
                cb.equal(root.get("previousStatus"), previousStatus);
    }

    public static Specification<ChangeStatusLog> hasNextStatus(String nextStatus) {
        if (nextStatus == null || nextStatus.isBlank()) return null;
        return (root, query, cb) ->
                cb.equal(root.get("nextStatus"), nextStatus);
    }

    public static Specification<ChangeStatusLog> hasDescription(String description) {
        if (description == null || description.isBlank()) return null;
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("description")), "%" + description.toLowerCase() + "%");
    }

    public static Specification<ChangeStatusLog> createdBetween(LocalDateTime fromDate, LocalDateTime toDate) {
        if (fromDate == null && toDate == null) return null;

        return (root, query, cb) -> {
            if (fromDate != null && toDate != null) {
                return cb.between(root.get("createdAt"), fromDate, toDate);
            } else if (fromDate != null) {
                return cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate);
            } else {
                return cb.lessThanOrEqualTo(root.get("createdAt"), toDate);
            }
        };
    }

    public static Specification<ChangeStatusLog> build(ChangeStatusLogFilterRequestDTO dto) {
        return Specification.allOf(
                hasModelName(dto.getModelName()),
                hasModelId(dto.getModelId()),
                hasPreviousStatus(dto.getPreviousStatus()),
                hasNextStatus(dto.getNextStatus()),
                hasDescription(dto.getDescription()),
                createdBetween(dto.getFromDate(), dto.getToDate())
        );
    }
}


