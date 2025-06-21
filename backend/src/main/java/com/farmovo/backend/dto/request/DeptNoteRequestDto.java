package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeptNoteRequestDto {
    private Long customerId;
    private BigDecimal amount;
    private LocalDateTime deptDate;
    private Long storeId;
    private String type;
    private String description;
    private String evidences;
    private String fromSource;
    private Long sourceId;
}
