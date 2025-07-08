package com.farmovo.backend.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class StocktakeRequestDto {
    private LocalDate stocktakeDate;
    private String detail; // JSON string
    private String stocktakeNote;
    private Long storeId;
    private String status; // DRAFT, IN_PROGRESS, COMPLETED, CANCELLED
}