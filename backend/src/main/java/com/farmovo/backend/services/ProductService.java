package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.ProductResponseDto;

import java.util.List;

public interface ProductService {
    List<ProductDto> getAllProductDto();

    ProductDto getProductNameById(Long id);

    List<ProductSaleResponseDto> getAllProductSaleDto();

    // Thêm method mới cho stocktake
    List<ProductResponseDto> getAllProducts();
}

