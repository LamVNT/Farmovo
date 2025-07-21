package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportDetailLotDto {
    private Long id;
    private String productName;
    private String zoneName;
    private String storeName;
    private LocalDate importDate;
    private Integer remainQuantity;
    private Boolean isCheck;
    private List<Long> zonesId;
} 