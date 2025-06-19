package com.farmovo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeptNoteResponseDto {
    private Long id;
    private Long customerId;
    private BigDecimal amount;
    private LocalDateTime deptDate;
    private Long storeId;
    private String type;
    private String description;
    private String evidences;
    private String fromSource;
    private Long sourceId;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}