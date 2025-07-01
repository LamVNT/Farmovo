package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionDetailRequest {
    private Integer importQuantity;
    private Integer remainQuantity;
    private LocalDateTime expireDate;
    private BigDecimal unitImportPrice;
    private BigDecimal unitSalePrice;
    private Long zoneId;
    private Long productId;
}