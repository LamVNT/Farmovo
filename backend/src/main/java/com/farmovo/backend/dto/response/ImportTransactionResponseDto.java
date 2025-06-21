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
    private String name;
    private BigDecimal total;
    private BigDecimal paid;
    private String detail;
    private String note;
    private String status;
    private Long customerId;
    private Long storeId;
    private Long staffId;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}
