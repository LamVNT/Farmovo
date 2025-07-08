package com.farmovo.backend.dto.request;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDto {
    private Long id;
    private String name;
    private String detail;
    private Integer quantity;
    private Long categoryId;
    private String categoryName;
    private Long storeId;
    private String storeName;
}


