package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DebtNoteResponseDto {
    private Long id;
    private Long customerId;
    private BigDecimal debtAmount;
    private LocalDateTime debtDate;
    private Long storeId;
    private String debtType;
    private String debtDescription;
    private String debtEvidences;
    private String fromSource;
    private Long sourceId;
    private LocalDateTime createdAt;
    private Long createdBy;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private Long deletedBy;
}