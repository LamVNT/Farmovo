package com.farmovo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionRequestDto {
    private String name;
    private BigDecimal total;
    private BigDecimal paid;
    private String detail;
    private String note;
    private String status;
    private Long customerId;
    private Long storeId;
    private Long staffId;
}
