package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.request.ProductRequestDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.models.Product;

import java.util.List;

public interface ProductService {
    List<ProductDto> getAllProductDto();

    ProductDto getProductNameById(Long id);

    List<ProductSaleResponseDto> getAllProductSaleDto();

    List<ProductResponseDto> getAllProducts();

    // Thêm các method mới
    ProductDto createProduct(ProductRequestDto productRequestDto);

    ProductDto updateProduct(Long id, ProductRequestDto productRequestDto);

    void deleteProduct(Long id);
}

