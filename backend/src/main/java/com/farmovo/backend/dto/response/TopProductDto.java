package com.farmovo.backend.dto.response;
import lombok.Data;

@Data
public class TopProductDto {
    private String productName;
    private String category;
    private Long quantity;
} 