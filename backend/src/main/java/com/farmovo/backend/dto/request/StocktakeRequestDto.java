package com.farmovo.backend.dto.request;

import com.farmovo.backend.dto.response.StocktakeDetailDto;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class StocktakeRequestDto {
    private Instant stocktakeDate;

    @NotEmpty(message = "detail is required")
    private List<StocktakeDetailDto> detail; // Chuẩn hóa detail là List object
    private String stocktakeNote;

    @NotNull(message = "storeId is required")
    private Long storeId;
    private String status; // DRAFT, IN_PROGRESS, COMPLETED, CANCELLED
}