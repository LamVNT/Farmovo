package com.farmovo.backend.dto.response;

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
    private Long customerId;
    private String status;
    private Long storeId;
    private Long staffId;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String importNote;
    private LocalDateTime importDate;
}
