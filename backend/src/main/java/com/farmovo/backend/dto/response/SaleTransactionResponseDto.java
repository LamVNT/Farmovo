package com.farmovo.backend.dto.response;

import com.farmovo.backend.models.SaleTransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleTransactionResponseDto {
    private Long id;
    private Long customerId;
    private Long storeId;
    private BigDecimal total;
    private BigDecimal paid;
    private String detail;
    private String note;
    private SaleTransactionStatus status;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}
