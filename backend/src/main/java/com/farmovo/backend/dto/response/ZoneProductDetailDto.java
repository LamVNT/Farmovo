package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneProductDetailDto {
    private Long importDetailId;
    private Long productId;
    private String productName;
    private Integer remainQuantity;
    private LocalDateTime expireDate;
    private List<Long> zonesId;
    private String zonesIdJson; // Giữ nguyên JSON string để debug
} 