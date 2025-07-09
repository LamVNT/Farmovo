package com.farmovo.backend.dto.request;

import lombok.Data;
import java.time.Instant;

@Data
public class StocktakeRequestDto {
    private Instant stocktakeDate;
    private String detail; // JSON string
    private String stocktakeNote;
    private Long storeId;
    private String status; // DRAFT, IN_PROGRESS, COMPLETED, CANCELLED
}