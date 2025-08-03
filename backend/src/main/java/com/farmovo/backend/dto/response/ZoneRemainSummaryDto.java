package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneRemainSummaryDto {
    private String zoneId;
    private String zoneName;
    private Integer totalRemain;
} 