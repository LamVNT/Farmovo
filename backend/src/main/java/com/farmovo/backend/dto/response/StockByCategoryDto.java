package com.farmovo.backend.dto.response;
import lombok.Data;

@Data
public class StockByCategoryDto {
    private String category;
    private Integer stock;
} 