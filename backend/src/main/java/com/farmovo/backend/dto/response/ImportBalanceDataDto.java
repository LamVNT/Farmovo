package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportBalanceDataDto {
    private Long productId;
    private String productName;
    private String productCode;
    private String batchCode; // Tên lô hàng
    private String name; // Tên hiển thị
    private Integer importQuantity;
    private BigDecimal unitImportPrice;
    private BigDecimal unitSalePrice;
    private List<Long> zones_id; // Vị trí
    private LocalDateTime expireDate;
}
