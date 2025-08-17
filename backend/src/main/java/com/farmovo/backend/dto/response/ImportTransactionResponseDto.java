package com.farmovo.backend.dto.response;

import com.farmovo.backend.models.ImportTransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionResponseDto {
    private Long id;
    private String name;
    private Long stocktakeId;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String importTransactionNote;
    private ImportTransactionStatus status;
    private LocalDateTime importDate;
    private Long supplierId;
    private String supplierName;
    private Long storeId;
    private Long staffId;
}
