package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportDetailStocktakeDto {
    private Long id;
    private String productName;
    private Integer remainQuantity;
    private List<Long> zones_id;
    private Boolean isCheck;
    private LocalDateTime expireDate;
} 