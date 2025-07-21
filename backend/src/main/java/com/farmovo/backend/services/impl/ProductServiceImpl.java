package com.farmovo.backend.services.impl;


import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.services.ProductService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

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

    @Override
    public List<ProductSaleResponseDto> getAllProductSaleDto() {
        return productMapper.toDtoProSaleList(productRepository.findAll());
    }

    @Override
    public List<ProductResponseDto> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return products.stream()
                .map(product -> {
                    ProductResponseDto dto = new ProductResponseDto();
                    dto.setId(null); // ImportTransactionDetail ID sẽ được set riêng
                    dto.setProId(product.getId());
                    dto.setName(product.getProductName());
                    dto.setRemainQuantity(0); // Sẽ được tính từ ImportTransactionDetail
                    dto.setUnitImportPrice(null); // Sẽ được set từ ImportTransactionDetail
                    dto.setUnitSalePrice(null); // Sẽ được set từ ImportTransactionDetail
                    dto.setCategoryName(product.getCategory() != null ? product.getCategory().getCategoryName() : null);
                    dto.setStoreName(product.getStore() != null ? product.getStore().getStoreName() : null);
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
