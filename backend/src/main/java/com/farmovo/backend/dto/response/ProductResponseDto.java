package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponseDto {
    private Long id;
    private String name; // tu bang Product
    private Integer remainQuantity;
    private BigDecimal unitImportPrice;
    private BigDecimal unitSalePrice;
    private String categoryName;
    private String storeName;
}