package com.farmovo.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DebtNoteRequestDto {
    private Long customerId;
    private BigDecimal debtAmount;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime debtDate;
    
    private Long storeId;
    private String debtType;
    private String debtDescription;
    private String debtEvidences;
    private String fromSource;
    private Long sourceId;
}
