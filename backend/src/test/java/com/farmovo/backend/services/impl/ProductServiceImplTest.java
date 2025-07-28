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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

class ProductServiceImplTest {
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductMapper productMapper;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private StoreRepository storeRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("getAllProductDto trả về danh sách sản phẩm")
    void testGetAllProductDto() {
        Product product = new Product();
        List<Product> products = Arrays.asList(product);
        given(productRepository.findAllWithCategoryAndStore()).willReturn(products);
        given(productRepository.findProductsWithoutCategoryOrStore()).willReturn(Collections.emptyList());
        List<ProductDto> productDtos = Arrays.asList(new ProductDto());
        given(productMapper.toDtoList(products)).willReturn(productDtos);

        List<ProductDto> result = productService.getAllProductDto();
        assertEquals(1, result.size());
        verify(productRepository).findAllWithCategoryAndStore();
        verify(productMapper).toDtoList(products);
    }

    @Test
    @DisplayName("getProductNameById trả về sản phẩm đúng id")
    void testGetProductNameById() {
        Product product = new Product();
        product.setId(1L);
        given(productRepository.findById(1L)).willReturn(Optional.of(product));
        ProductDto dto = new ProductDto();
        given(productMapper.toDto(product)).willReturn(dto);

        ProductDto result = productService.getProductNameById(1L);
        assertNotNull(result);
        verify(productRepository).findById(1L);
        verify(productMapper).toDto(product);
    }

    @Test
    @DisplayName("getProductNameById ném ResourceNotFoundException nếu không tìm thấy")
    void testGetProductNameById_NotFound() {
        given(productRepository.findById(2L)).willReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> productService.getProductNameById(2L));
    }

    @Test
    @DisplayName("createProduct thành công")
    void testCreateProduct() {
        ProductRequestDto req = new ProductRequestDto();
        req.setProductName("Test");
        req.setCategoryId(1L);
        req.setStoreId(2L);
        Category category = new Category();
        Store store = new Store();
        Product product = new Product();
        product.setId(10L);
        Product savedProduct = new Product();
        savedProduct.setId(10L);
        ProductDto dto = new ProductDto();
        given(categoryRepository.findById(1L)).willReturn(Optional.of(category));
        given(storeRepository.findById(2L)).willReturn(Optional.of(store));
        given(productRepository.save(any(Product.class))).willReturn(savedProduct);
        given(productMapper.toDto(savedProduct)).willReturn(dto);

        ProductDto result = productService.createProduct(req);
        assertNotNull(result);
        verify(productRepository, atLeastOnce()).save(any(Product.class));
        verify(productMapper).toDto(savedProduct);
    }

    @Test
    @DisplayName("createProduct ném IllegalArgumentException nếu thiếu tên")
    void testCreateProduct_MissingName() {
        ProductRequestDto req = new ProductRequestDto();
        req.setCategoryId(1L);
        req.setStoreId(2L);
        assertThrows(IllegalArgumentException.class, () -> productService.createProduct(req));
    }

    @Test
    @DisplayName("updateProduct thành công")
    void testUpdateProduct() {
        ProductRequestDto req = new ProductRequestDto();
        req.setProductName("Test");
        req.setCategoryId(1L);
        req.setStoreId(2L);
        Product existing = new Product();
        Category category = new Category();
        Store store = new Store();
        Product updated = new Product();
        updated.setId(10L);
        ProductDto dto = new ProductDto();
        given(productRepository.findById(10L)).willReturn(Optional.of(existing));
        given(categoryRepository.findById(1L)).willReturn(Optional.of(category));
        given(storeRepository.findById(2L)).willReturn(Optional.of(store));
        given(productRepository.save(existing)).willReturn(updated);
        given(productMapper.toDto(updated)).willReturn(dto);

        ProductDto result = productService.updateProduct(10L, req);
        assertNotNull(result);
        verify(productRepository).findById(10L);
        verify(productRepository).save(existing);
        verify(productMapper).toDto(updated);
    }

    @Test
    @DisplayName("updateProduct ném ResourceNotFoundException nếu không tìm thấy")
    void testUpdateProduct_NotFound() {
        ProductRequestDto req = new ProductRequestDto();
        req.setProductName("Test");
        req.setCategoryId(1L);
        req.setStoreId(2L);
        given(productRepository.findById(99L)).willReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> productService.updateProduct(99L, req));
    }

    @Test
    @DisplayName("deleteProduct thành công")
    void testDeleteProduct() {
        Product product = new Product();
        product.setId(1L);
        given(productRepository.findById(1L)).willReturn(Optional.of(product));
        doNothing().when(productRepository).delete(product);
        assertDoesNotThrow(() -> productService.deleteProduct(1L));
        verify(productRepository).delete(product);
    }

    @Test
    @DisplayName("deleteProduct ném ResourceNotFoundException nếu không tìm thấy")
    void testDeleteProduct_NotFound() {
        given(productRepository.findById(2L)).willReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> productService.deleteProduct(2L));
    }
} 