package com.farmovo.backend.services.impl;


import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    public ProductServiceImpl(ProductRepository productRepository, ProductMapper productMapper) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
    }

    @Override
    public List<ProductDto> getAllProductDto() {
        return productMapper.toDtoList(productRepository.findAll());
    }

    @Override
    public ProductDto getProductNameById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return productMapper.toDto(product);
    }



}
