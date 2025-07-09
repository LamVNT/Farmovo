package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.services.ProductService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    public ProductServiceImpl(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public List<ProductDto> getAllProductDto() {
        return productRepository.findAll().stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public ProductDto getProductNameById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return convertToDto(product);
    }

    private ProductDto convertToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getProductName());
        dto.setDetail(product.getProductDescription());
        dto.setQuantity(product.getProductQuantity());

        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getId());
            dto.setCategoryName(product.getCategory().getCategoryName());
        }

        if (product.getStore() != null) {
            dto.setStoreId(product.getStore().getId());
            dto.setStoreName(product.getStore().getStoreName());
        }

        return dto;
    }
}
