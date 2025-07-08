package com.farmovo.backend.dto.request;

import com.farmovo.backend.models.SaleTransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleTransactionRequestDto {
    private Long customerId;
    private Long storeId;
    private BigDecimal total;
    private BigDecimal paid;
    private String detail;
    private String note;
    private SaleTransactionStatus status;
}

