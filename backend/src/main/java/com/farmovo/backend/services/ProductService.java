package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.models.Product;

import java.util.List;

public interface ProductService {
    List<ProductDto> getAllProductDto();
    ProductDto getProductNameById(Long id);

}

