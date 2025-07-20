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
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {

    private static final Logger logger = LogManager.getLogger(ProductServiceImpl.class);
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
        logger.info("Retrieving all products");
        List<Product> products = productRepository.findAllWithCategoryAndStore();
        logger.info("Found {} products", products.size());
        
        // Kiểm tra products không có category hoặc store
        List<Product> invalidProducts = productRepository.findProductsWithoutCategoryOrStore();
        if (!invalidProducts.isEmpty()) {
            logger.warn("Found {} products without category or store: {}", 
                invalidProducts.size(), 
                invalidProducts.stream().map(p -> p.getId() + ":" + p.getProductName()).collect(Collectors.joining(", "))
            );
        }
        
        // Debug: kiểm tra từng product có category và store không
        for (Product product : products) {
            logger.debug("Product: id={}, name={}, category={}, store={}", 
                product.getId(), 
                product.getProductName(),
                product.getCategory() != null ? product.getCategory().getCategoryName() : "NULL",
                product.getStore() != null ? product.getStore().getStoreName() : "NULL"
            );
        }
        
        return productMapper.toDtoList(products);
    }

    @Override
    public ProductDto getProductNameById(Long id) {
        logger.info("Retrieving product with id: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return productMapper.toDto(product);
    }

    @Override
    public List<ProductSaleResponseDto> getAllProductSaleDto() {
        logger.info("Retrieving all product sales DTO");
        return productMapper.toDtoProSaleList(productRepository.findAllWithCategoryAndStore());
    }

    @Override
    public ProductDto createProduct(ProductRequestDto productRequestDto) {
        logger.info("Creating new product: {}", productRequestDto.getProductName());
        try {
            // Validate required fields (annotation validate đã có)
            if (productRequestDto.getProductName() == null || productRequestDto.getProductName().trim().isEmpty()) {
                throw new IllegalArgumentException("Tên sản phẩm không được để trống");
            }
            if (productRequestDto.getCategoryId() == null) {
                throw new IllegalArgumentException("Danh mục không được để trống");
            }
            if (productRequestDto.getStoreId() == null) {
                throw new IllegalArgumentException("Cửa hàng không được để trống");
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
            logger.info("Product created successfully: id={}", savedProduct.getId());
            return productMapper.toDto(savedProduct);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            logger.error("Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error creating product: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo sản phẩm: " + e.getMessage());
        }
    }

    @Override
    public ProductDto updateProduct(Long id, ProductRequestDto productRequestDto) {
        logger.info("Updating product with id: {}", id);
        try {
            Product existingProduct = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
            if (productRequestDto.getProductName() == null || productRequestDto.getProductName().trim().isEmpty()) {
                throw new IllegalArgumentException("Tên sản phẩm không được để trống");
            }
            if (productRequestDto.getCategoryId() == null) {
                throw new IllegalArgumentException("Danh mục không được để trống");
            }
            if (productRequestDto.getStoreId() == null) {
                throw new IllegalArgumentException("Cửa hàng không được để trống");
            }
            Category category = categoryRepository.findById(productRequestDto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + productRequestDto.getCategoryId()));
            Store store = storeRepository.findById(productRequestDto.getStoreId())
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found with id: " + productRequestDto.getStoreId()));
            existingProduct.setProductName(productRequestDto.getProductName());
            existingProduct.setProductDescription(productRequestDto.getProductDescription());
            existingProduct.setProductQuantity(productRequestDto.getProductQuantity() != null ? productRequestDto.getProductQuantity() : existingProduct.getProductQuantity());
            existingProduct.setCategory(category);
            existingProduct.setStore(store);
            Product updatedProduct = productRepository.save(existingProduct);
            logger.info("Product updated successfully: id={}", updatedProduct.getId());
            return productMapper.toDto(updatedProduct);
        } catch (IllegalArgumentException | ResourceNotFoundException e) {
            logger.error("Validation error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error updating product: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi cập nhật sản phẩm: " + e.getMessage());
        }
    }

    @Override
    public void deleteProduct(Long id) {
        logger.info("Attempting to delete product with id: {}", id);
        try {
            Product product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
            productRepository.delete(product);
            logger.info("Product with id {} deleted successfully", id);
        } catch (ResourceNotFoundException e) {
            logger.error("Delete error: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error deleting product: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi xóa sản phẩm: " + e.getMessage());
        }
    }
}
