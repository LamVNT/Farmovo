package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRemainSummaryDto {
    private Long productId;
    private String productName;
    private Integer totalRemain;
    private List<ZoneRemainSummaryDto> zones;
} 