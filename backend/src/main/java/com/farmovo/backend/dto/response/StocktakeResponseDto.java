package com.farmovo.backend.dto.response;

import com.farmovo.backend.models.StocktakeStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeResponseDto {
    private Long id;
    private Long storeId;
    private Long zoneId;
    private Long productId;
    private LocalDate stocktakeDate;
    private Integer actualQuantity;
    private Integer recordedQuantity;
    private String note;
    private StocktakeStatus status;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}
