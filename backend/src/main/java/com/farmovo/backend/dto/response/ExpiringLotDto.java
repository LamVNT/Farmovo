package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringLotDto {
    private Long id;
    private String productCode;
    private String lotCode;
    private String zoneName;
    private LocalDateTime expireDate;
    private Integer daysLeft;
} 