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

    // ========== PRODUCT CREATION TESTS BASED ON NEW UTCID01-UTCID11 TABLE ==========
    
    @Test
    @DisplayName("UTCID01: Normal - Valid product creation with Trứng gà ta bé")
    void testCreateProduct_UTCID01_ValidProduct_TrungGaTaBe() {
        // Arrange - UTCID01: Normal case with Trứng gà ta bé
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName("Trứng gà ta bé");
        request.setProductDescription(null);
        request.setProductQuantity(0);
        request.setCategoryId(1L); // Trứng vịt
        request.setStoreId(1L); // FPT Mart
        
        Category category = new Category();
        category.setId(1L);
        category.setCategoryName("Trứng vịt");
        
        Store store = new Store();
        store.setId(1L);
        store.setStoreName("FPT Mart");
        
        Product savedProduct = new Product();
        savedProduct.setId(1L);
        savedProduct.setProductName("Trứng gà ta bé");
        savedProduct.setProductCode("SP000001");
        
        ProductDto expectedDto = new ProductDto();
        expectedDto.setId(1L);
        expectedDto.setProductName("Trứng gà ta bé");
        
        given(categoryRepository.findById(1L)).willReturn(Optional.of(category));
        given(storeRepository.findById(1L)).willReturn(Optional.of(store));
        given(productRepository.findByProductNameAndStoreIgnoreCase(anyString(), anyLong())).willReturn(Optional.empty());
        given(productRepository.save(any(Product.class))).willReturn(savedProduct);
        given(productMapper.toDto(savedProduct)).willReturn(expectedDto);
        
        // Act
        ProductDto result = productService.createProduct(request);
        
        // Assert
        assertNotNull(result);
        assertEquals("Trứng gà ta bé", result.getProductName());
        verify(productRepository, times(2)).save(any(Product.class)); // Save twice for code generation
    }

    @Test
    @DisplayName("UTCID02: Abnormal - Negative quantity (-10)")
    void testCreateProduct_UTCID02_NegativeQuantity_ShouldFail() {
        // Arrange - UTCID02: Abnormal case - negative quantity
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName("Trứng vịt lộn nhỏ");
        request.setProductDescription(null);
        request.setProductQuantity(-10);
        request.setCategoryId(2L); // Trứng gà
        request.setStoreId(2L); // Green Mart
        
        // Act & Assert
        Exception ex = assertThrows(IllegalArgumentException.class, () -> productService.createProduct(request));
        assertTrue(ex.getMessage().contains("Số lượng phải lớn hơn hoặc bằng 0"));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID03: Boundary - Null product name")
    void testCreateProduct_UTCID03_NullProductName_ShouldFail() {
        // Arrange - UTCID03: Boundary case - null product name
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName(null);
        request.setProductDescription(null);
        request.setProductQuantity(0);
        request.setCategoryId(3L); // Trứng đà điểu
        request.setStoreId(1L); // FPT Mart
        
        // Act & Assert
        Exception ex = assertThrows(IllegalArgumentException.class, () -> productService.createProduct(request));
        assertTrue(ex.getMessage().contains("Tên sản phẩm không được để trống"));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID04: Boundary - Special characters in product name")
    void testCreateProduct_UTCID04_SpecialCharacters_ShouldFail() {
        // Arrange - UTCID04: Boundary case - special characters in name
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName("Trứng @#$%");
        request.setProductDescription(null);
        request.setProductQuantity(0);
        request.setCategoryId(4L); // Trứng ngan
        request.setStoreId(2L); // Green Mart
        
        // Act & Assert
        Exception ex = assertThrows(IllegalArgumentException.class, () -> productService.createProduct(request));
        assertTrue(ex.getMessage().contains("Tên sản phẩm không được chứa ký tự đặc biệt"));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID05: Normal - Valid product creation with Trứng gà loại 1")
    void testCreateProduct_UTCID05_ValidProduct_TrungGaLoai1() {
        // Arrange - UTCID05: Normal case with Trứng gà loại 1
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName("Trứng gà  loại 1");
        request.setProductDescription(null);
        request.setProductQuantity(10);
        request.setCategoryId(2L); // Trứng gà
        request.setStoreId(1L); // FPT Mart
        
        Category category = new Category();
        category.setId(2L);
        category.setCategoryName("Trứng gà");
        
        Store store = new Store();
        store.setId(1L);
        store.setStoreName("FPT Mart");
        
        Product savedProduct = new Product();
        savedProduct.setId(5L);
        savedProduct.setProductName("Trứng gà  loại 1");
        savedProduct.setProductCode("SP000005");
        
        ProductDto expectedDto = new ProductDto();
        expectedDto.setId(5L);
        expectedDto.setProductName("Trứng gà  loại 1");
        
        given(categoryRepository.findById(2L)).willReturn(Optional.of(category));
        given(storeRepository.findById(1L)).willReturn(Optional.of(store));
        given(productRepository.findByProductNameAndStoreIgnoreCase(anyString(), anyLong())).willReturn(Optional.empty());
        given(productRepository.save(any(Product.class))).willReturn(savedProduct);
        given(productMapper.toDto(savedProduct)).willReturn(expectedDto);
        
        // Act
        ProductDto result = productService.createProduct(request);
        
        // Assert
        assertNotNull(result);
        assertEquals("Trứng gà  loại 1", result.getProductName());
        verify(productRepository, times(2)).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID06: Boundary - Product name 101 characters (should fail)")
    void testCreateProduct_UTCID06_ProductName_101Characters_ShouldFail() {
        // Arrange - UTCID06: Boundary case - product name exceeds max length
        String tooLongName = "Trứng gàaaa......aa" + "A".repeat(82); // Exactly 101 characters
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName(tooLongName);
        request.setProductDescription(null);
        request.setProductQuantity(10);
        request.setCategoryId(2L); // Trứng gà
        request.setStoreId(1L); // FPT Mart
        
        // Act & Assert
        Exception ex = assertThrows(IllegalArgumentException.class, () -> productService.createProduct(request));
        assertTrue(ex.getMessage().contains("Tên sản phẩm phải từ 1 đến 100 ký tự"));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID07: Normal - Valid product creation with Trứng vịt lộn nhỏ")
    void testCreateProduct_UTCID07_ValidProduct_TrungVitLonNho() {
        // Arrange - UTCID07: Normal case with Trứng vịt lộn nhỏ
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName("Trứng vịt lộn nhỏ");
        request.setProductDescription("Trứng gà loại 1");
        request.setProductQuantity(0);
        request.setCategoryId(1L); // Trứng vịt
        request.setStoreId(2L); // Green Mart
        
        Category category = new Category();
        category.setId(1L);
        category.setCategoryName("Trứng vịt");
        
        Store store = new Store();
        store.setId(2L);
        store.setStoreName("Green Mart");
        
        Product savedProduct = new Product();
        savedProduct.setId(7L);
        savedProduct.setProductName("Trứng vịt lộn nhỏ");
        savedProduct.setProductCode("SP000007");
        
        ProductDto expectedDto = new ProductDto();
        expectedDto.setId(7L);
        expectedDto.setProductName("Trứng vịt lộn nhỏ");
        
        given(categoryRepository.findById(1L)).willReturn(Optional.of(category));
        given(storeRepository.findById(2L)).willReturn(Optional.of(store));
        given(productRepository.findByProductNameAndStoreIgnoreCase(anyString(), anyLong())).willReturn(Optional.empty());
        given(productRepository.save(any(Product.class))).willReturn(savedProduct);
        given(productMapper.toDto(savedProduct)).willReturn(expectedDto);
        
        // Act
        ProductDto result = productService.createProduct(request);
        
        // Assert
        assertNotNull(result);
        assertEquals("Trứng vịt lộn nhỏ", result.getProductName());
        verify(productRepository, times(2)).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID08: Boundary - Quantity 2,147,483,647 (should fail)")
    void testCreateProduct_UTCID08_Quantity_2147483647_ShouldFail() {
        // Arrange - UTCID08: Boundary case - quantity at max integer
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName("Trứng @#$%");
        request.setProductDescription(null);
        request.setProductQuantity(2147483647);
        request.setCategoryId(2L); // Trứng gà
        request.setStoreId(1L); // FPT Mart
        
        // Act & Assert
        Exception ex = assertThrows(IllegalArgumentException.class, () -> productService.createProduct(request));
        assertTrue(ex.getMessage().contains("Quantity must be < 2 147 483 647"));
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID09: Normal - Valid product creation with Trứng gà loại 1")
    void testCreateProduct_UTCID09_ValidProduct_TrungGaLoai1_Second() {
        // Arrange - UTCID09: Normal case with Trứng gà loại 1 (second instance)
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName("Trứng gà  loại 1");
        request.setProductDescription("Trứng gàaaa....aa(100 characters)");
        request.setProductQuantity(10);
        request.setCategoryId(4L); // Trứng ngan
        request.setStoreId(2L); // Green Mart
        
        Category category = new Category();
        category.setId(4L);
        category.setCategoryName("Trứng ngan");
        
        Store store = new Store();
        store.setId(2L);
        store.setStoreName("Green Mart");
        
        Product savedProduct = new Product();
        savedProduct.setId(9L);
        savedProduct.setProductName("Trứng gà  loại 1");
        savedProduct.setProductCode("SP000009");
        
        ProductDto expectedDto = new ProductDto();
        expectedDto.setId(9L);
        expectedDto.setProductName("Trứng gà  loại 1");
        
        given(categoryRepository.findById(4L)).willReturn(Optional.of(category));
        given(storeRepository.findById(2L)).willReturn(Optional.of(store));
        given(productRepository.findByProductNameAndStoreIgnoreCase(anyString(), anyLong())).willReturn(Optional.empty());
        given(productRepository.save(any(Product.class))).willReturn(savedProduct);
        given(productMapper.toDto(savedProduct)).willReturn(expectedDto);
        
        // Act
        ProductDto result = productService.createProduct(request);
        
        // Assert
        assertNotNull(result);
        assertEquals("Trứng gà  loại 1", result.getProductName());
        verify(productRepository, times(2)).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID10: Normal - Valid product creation with Trứng gà loại 1")
    void testCreateProduct_UTCID10_ValidProduct_TrungGaLoai1_Third() {
        // Arrange - UTCID10: Normal case with Trứng gà loại 1 (third instance)
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName("Trứng gà  loại 1");
        request.setProductDescription(null);
        request.setProductQuantity(0);
        request.setCategoryId(2L); // Trứng gà
        request.setStoreId(1L); // FPT Mart
        
        Category category = new Category();
        category.setId(2L);
        category.setCategoryName("Trứng gà");
        
        Store store = new Store();
        store.setId(1L);
        store.setStoreName("FPT Mart");
        
        Product savedProduct = new Product();
        savedProduct.setId(10L);
        savedProduct.setProductName("Trứng gà  loại 1");
        savedProduct.setProductCode("SP000010");
        
        ProductDto expectedDto = new ProductDto();
        expectedDto.setId(10L);
        expectedDto.setProductName("Trứng gà  loại 1");
        
        given(categoryRepository.findById(2L)).willReturn(Optional.of(category));
        given(storeRepository.findById(1L)).willReturn(Optional.of(store));
        given(productRepository.findByProductNameAndStoreIgnoreCase(anyString(), anyLong())).willReturn(Optional.empty());
        given(productRepository.save(any(Product.class))).willReturn(savedProduct);
        given(productMapper.toDto(savedProduct)).willReturn(expectedDto);
        
        // Act
        ProductDto result = productService.createProduct(request);
        
        // Assert
        assertNotNull(result);
        assertEquals("Trứng gà  loại 1", result.getProductName());
        verify(productRepository, times(2)).save(any(Product.class));
    }

    @Test
    @DisplayName("UTCID11: Normal - Valid product creation with Trứng gàaaa......aa(101 characters)")
    void testCreateProduct_UTCID11_ValidProduct_TrungGa101Chars() {
        // Arrange - UTCID11: Normal case with Trứng gàaaa......aa(101 characters)
        String longName = "Trứng gàaaa......aa" + "A".repeat(82); // Exactly 101 characters
        ProductRequestDto request = new ProductRequestDto();
        request.setProductName(longName);
        request.setProductDescription("Trứng @#$%");
//        request.setProductQuantity(2147483648); // This will cause overflow
        request.setProductQuantity(214748348);
        request.setCategoryId(null); // null category
        request.setStoreId(null); // null store
        
        // Act & Assert
        Exception ex = assertThrows(IllegalArgumentException.class, () -> productService.createProduct(request));
        assertTrue(ex.getMessage().contains("Danh mục không được để trống"));
        verify(productRepository, never()).save(any(Product.class));
    }
} 