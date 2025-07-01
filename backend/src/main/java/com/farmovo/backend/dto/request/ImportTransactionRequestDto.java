package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionRequestDto {
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String status;
    private Long createdBy;
    private Long updatedBy;

    private Long customerId;
    private Long storeId;
    private Long staffId;

    private List<ImportTransactionDetailRequest> details;
}
