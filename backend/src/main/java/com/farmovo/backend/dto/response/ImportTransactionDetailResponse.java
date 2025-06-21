package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionDetailResponse {
    private Long id;
    private Long importTransactionId;
    private Long zoneId;
    private Integer quantity;
    private Integer remainQuantity;
    private Long productId;
    private LocalDateTime expireDate;
    private BigDecimal unitImportPrice;
    private BigDecimal unitSalePrice;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}
