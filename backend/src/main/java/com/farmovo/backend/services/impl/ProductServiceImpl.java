package com.farmovo.backend.services.impl;


import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.request.ProductRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.exceptions.ResourceNotFoundException;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.Category;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.CategoryRepository;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;
    private final CategoryRepository categoryRepository;
    private final StoreRepository storeRepository;

    public ProductServiceImpl(ProductRepository productRepository, ProductMapper productMapper, 
                           CategoryRepository categoryRepository, StoreRepository storeRepository) {
        this.productRepository = productRepository;
        this.productMapper = productMapper;
        this.categoryRepository = categoryRepository;
        this.storeRepository = storeRepository;
    }

    @Override
    public List<ProductDto> getAllProductDto() {
        return productMapper.toDtoList(productRepository.findAll());
    }

    @Override
    public ProductDto getProductNameById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return productMapper.toDto(product);
    }

    @Override
    public List<ProductSaleResponseDto> getAllProductSaleDto() {
        return productMapper.toDtoProSaleList(productRepository.findAll());
    }

    @Override
    public ProductDto createProduct(ProductRequestDto productRequestDto) {
        // Validate required fields
        if (productRequestDto.getProductName() == null || productRequestDto.getProductName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name is required");
        }
        if (productRequestDto.getCategoryId() == null) {
            throw new IllegalArgumentException("Category ID is required");
        }
        if (productRequestDto.getStoreId() == null) {
            throw new IllegalArgumentException("Store ID is required");
        }

        // Find category and store
        Category category = categoryRepository.findById(productRequestDto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + productRequestDto.getCategoryId()));
        
        Store store = storeRepository.findById(productRequestDto.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + productRequestDto.getStoreId()));

        // Create new product
        Product product = new Product();
        product.setProductName(productRequestDto.getProductName());
        product.setProductDescription(productRequestDto.getProductDescription());
        product.setProductQuantity(productRequestDto.getProductQuantity() != null ? productRequestDto.getProductQuantity() : 0);
        product.setCategory(category);
        product.setStore(store);

        Product savedProduct = productRepository.save(product);
        return productMapper.toDto(savedProduct);
    }

    @Override
    public ProductDto updateProduct(Long id, ProductRequestDto productRequestDto) {
        // Find existing product
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        // Validate required fields
        if (productRequestDto.getProductName() == null || productRequestDto.getProductName().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name is required");
        }
        if (productRequestDto.getCategoryId() == null) {
            throw new IllegalArgumentException("Category ID is required");
        }
        if (productRequestDto.getStoreId() == null) {
            throw new IllegalArgumentException("Store ID is required");
        }

        // Find category and store
        Category category = categoryRepository.findById(productRequestDto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + productRequestDto.getCategoryId()));
        
        Store store = storeRepository.findById(productRequestDto.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + productRequestDto.getStoreId()));

        // Update product fields
        existingProduct.setProductName(productRequestDto.getProductName());
        existingProduct.setProductDescription(productRequestDto.getProductDescription());
        existingProduct.setProductQuantity(productRequestDto.getProductQuantity() != null ? productRequestDto.getProductQuantity() : existingProduct.getProductQuantity());
        existingProduct.setCategory(category);
        existingProduct.setStore(store);

        Product updatedProduct = productRepository.save(existingProduct);
        return productMapper.toDto(updatedProduct);
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        
        productRepository.delete(product);
    }
}
