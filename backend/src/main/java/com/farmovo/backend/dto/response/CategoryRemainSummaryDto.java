package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRemainSummaryDto {
    private String category;
    private Integer totalRemain;
    private List<ProductRemainSummaryDto> products;
} 