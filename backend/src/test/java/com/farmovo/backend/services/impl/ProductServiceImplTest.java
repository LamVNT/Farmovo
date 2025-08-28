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

    @Test
    void createProduct_ShouldThrowException_WhenProductNameExistsInSameStoreAndCategory() {
        // Given
        ProductRequestDto requestDto = new ProductRequestDto();
        requestDto.setProductName("Trứng Ngan");
        requestDto.setCategoryId(1L);
        requestDto.setStoreId(1L);
        requestDto.setProductQuantity(10);

        Category category = new Category();
        category.setId(1L);
        category.setCategoryName("Trứng");

        Store store = new Store();
        store.setId(1L);
        store.setStoreName("Cửa hàng 1");

        Product existingProduct = new Product();
        existingProduct.setId(1L);
        existingProduct.setProductName("Trứng ngan"); // Tên tương tự nhưng khác hoa thường
        existingProduct.setCategory(category);
        existingProduct.setStore(store);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(productRepository.findByProductNameAndStoreAndCategoryIgnoreCase("Trứng Ngan", 1L, 1L))
                .thenReturn(Optional.of(existingProduct));

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            productService.createProduct(requestDto);
        });

        assertEquals("Sản phẩm 'Trứng Ngan' đã tồn tại trong danh mục và cửa hàng này", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void updateProduct_ShouldThrowException_WhenProductNameExistsInSameStoreAndCategory() {
        // Given
        Long productId = 1L;
        ProductRequestDto requestDto = new ProductRequestDto();
        requestDto.setProductName("Trứng Ngan");
        requestDto.setCategoryId(1L);
        requestDto.setStoreId(1L);
        requestDto.setProductQuantity(10);

        Product existingProduct = new Product();
        existingProduct.setId(productId);
        existingProduct.setProductName("Trứng Vịt");

        Category category = new Category();
        category.setId(1L);
        category.setCategoryName("Trứng");

        Store store = new Store();
        store.setId(1L);
        store.setStoreName("Cửa hàng 1");

        Product duplicateProduct = new Product();
        duplicateProduct.setId(2L);
        duplicateProduct.setProductName("Trứng ngan"); // Tên tương tự nhưng khác hoa thường

        when(productRepository.findById(productId)).thenReturn(Optional.of(existingProduct));
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(productRepository.findByProductNameAndStoreAndCategoryIgnoreCaseExcludingId("Trứng Ngan", 1L, 1L, productId))
                .thenReturn(Optional.of(duplicateProduct));

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            productService.updateProduct(productId, requestDto);
        });

        assertEquals("Sản phẩm 'Trứng Ngan' đã tồn tại trong danh mục và cửa hàng này", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void createProduct_OwnerCanCreateSameNameInDifferentStore() {
        // Given: Owner tạo sản phẩm "Trứng Ngan" ở Store A
        ProductRequestDto requestDto = new ProductRequestDto();
        requestDto.setProductName("Trứng Ngan");
        requestDto.setCategoryId(1L);
        requestDto.setStoreId(1L);
        requestDto.setProductQuantity(10);
        requestDto.setUserRole("OWNER");

        Category category = new Category();
        category.setId(1L);
        category.setCategoryName("Trứng");

        Store store1 = new Store();
        store1.setId(1L);
        store1.setStoreName("Store A");

        // Không có sản phẩm trùng lặp trong Store 1
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store1));
        when(productRepository.findByProductNameAndStoreIgnoreCase("Trứng Ngan", 1L))
                .thenReturn(Optional.empty());

        Product product1 = new Product();
        product1.setId(1L);
        product1.setProductName("Trứng Ngan");
        product1.setCategory(category);
        product1.setStore(store1);
        product1.setProductCode("SP000001");

        when(productRepository.save(any(Product.class))).thenReturn(product1);
        when(productMapper.toDto(any(Product.class))).thenReturn(new ProductDto());

        // When & Then: Tạo sản phẩm đầu tiên thành công
        ProductDto result1 = productService.createProduct(requestDto);
        assertNotNull(result1);
        verify(productRepository).findByProductNameAndStoreIgnoreCase("Trứng Ngan", 1L);

        // Given: Owner tạo sản phẩm "Trứng Ngan" ở Store B (cùng tên, khác store)
        ProductRequestDto requestDto2 = new ProductRequestDto();
        requestDto2.setProductName("Trứng Ngan");
        requestDto2.setCategoryId(1L);
        requestDto2.setStoreId(2L);
        requestDto2.setProductQuantity(10);
        requestDto2.setUserRole("OWNER");

        Store store2 = new Store();
        store2.setId(2L);
        store2.setStoreName("Store B");

        // Không có sản phẩm trùng lặp trong Store 2
        when(storeRepository.findById(2L)).thenReturn(Optional.of(store2));
        when(productRepository.findByProductNameAndStoreIgnoreCase("Trứng Ngan", 2L))
                .thenReturn(Optional.empty());

        Product product2 = new Product();
        product2.setId(2L);
        product2.setProductName("Trứng Ngan");
        product2.setCategory(category);
        product2.setStore(store2);
        product2.setProductCode("SP000002");

        when(productRepository.save(any(Product.class))).thenReturn(product2);

        // When & Then: Tạo sản phẩm thứ hai thành công (cùng tên, khác store)
        ProductDto result2 = productService.createProduct(requestDto2);
        assertNotNull(result2);
        verify(productRepository).findByProductNameAndStoreIgnoreCase("Trứng Ngan", 2L);
    }

    @Test
    void createProduct_OwnerCannotCreateSameNameInSameStore() {
        // Given: Owner tạo sản phẩm "Trứng Ngan" ở Store A
        ProductRequestDto requestDto = new ProductRequestDto();
        requestDto.setProductName("Trứng Ngan");
        requestDto.setCategoryId(1L);
        requestDto.setStoreId(1L);
        requestDto.setProductQuantity(10);
        requestDto.setUserRole("OWNER");

        Category category = new Category();
        category.setId(1L);
        category.setCategoryName("Trứng");

        Store store = new Store();
        store.setId(1L);
        store.setStoreName("Store A");

        Product existingProduct = new Product();
        existingProduct.setId(1L);
        existingProduct.setProductName("Trứng ngan"); // Tên tương tự nhưng khác hoa thường
        existingProduct.setCategory(category);
        existingProduct.setStore(store);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));
        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));
        when(productRepository.findByProductNameAndStoreIgnoreCase("Trứng Ngan", 1L))
                .thenReturn(Optional.of(existingProduct));

        // When & Then: Không thể tạo sản phẩm trùng lặp trong cùng store
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            productService.createProduct(requestDto);
        });

        assertEquals("Sản phẩm 'Trứng Ngan' đã tồn tại trong cửa hàng này", exception.getMessage());
        verify(productRepository, never()).save(any(Product.class));
    }
} 