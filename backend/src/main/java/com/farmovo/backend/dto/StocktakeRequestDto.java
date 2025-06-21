package com.farmovo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeRequestDto {
    private Long storeId;
    private Long zoneId;
    private Long productId;
    private LocalDate stocktakeDate;
    private Integer actualQuantity;
    private Integer recordedQuantity;
    private Integer difference;
    private String note;
}