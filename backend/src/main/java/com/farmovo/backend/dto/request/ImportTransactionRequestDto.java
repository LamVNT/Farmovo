package com.farmovo.backend.dto.request;

import com.farmovo.backend.models.ImportTransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionRequestDto {
    private String name;
    private BigDecimal total;
    private BigDecimal paid;
    private String detail;
    private String note;
    private ImportTransactionStatus status;
    private String importTransactionNote;
    private LocalDateTime importDate;
    private Long supplierId;
    private Long storeId;
    private Long staffId;
}
