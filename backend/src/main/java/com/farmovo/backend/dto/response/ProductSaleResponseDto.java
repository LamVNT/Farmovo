package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSaleResponseDto {
    private Long id; // importtransactiondetailID
    private Long proId;
    private String name; // tu bang Product
    private Integer quantity;
    private BigDecimal unitSalePrice;
}
