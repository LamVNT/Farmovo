package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MissingZoneDto {
    private Long productId;
    private String productName;
    private List<ZoneResponseDto> missingZones;
    private List<ZoneResponseDto> checkedZones; // Zones đã được kiểm kê
    private Integer totalRemainQuantity; // Tổng số lượng còn lại của sản phẩm
} 