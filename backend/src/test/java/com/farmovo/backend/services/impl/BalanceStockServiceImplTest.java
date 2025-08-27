package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.models.Category;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BalanceStockServiceImplTest {

    @Mock
    private ImportTransactionDetailRepository importTransactionDetailRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private BalanceStockServiceImpl balanceStockService;

    private StocktakeDetailDto stocktakeDetailDto;
    private ImportTransactionDetail importTransactionDetail;
    private Product product;
    private Category category;
    private Store store;

    @BeforeEach
    void setUp() {
        // Setup test data
        category = new Category();
        category.setCategoryName("Test Category");

        store = new Store();
        store.setStoreName("Test Store");

        product = new Product();
        product.setId(1L);
        product.setProductName("Test Product");
        product.setProductCode("TP001");
        product.setCategory(category);
        product.setStore(store);

        importTransactionDetail = new ImportTransactionDetail();
        importTransactionDetail.setId(100L);
        importTransactionDetail.setProduct(product);
        importTransactionDetail.setRemainQuantity(50);
        importTransactionDetail.setUnitSalePrice(new BigDecimal("25000"));
        importTransactionDetail.setName("LH000001");
        importTransactionDetail.setCreatedAt(LocalDateTime.now());
        importTransactionDetail.setExpireDate(LocalDateTime.now().plusDays(30));

        stocktakeDetailDto = new StocktakeDetailDto();
        stocktakeDetailDto.setId(100L);
        stocktakeDetailDto.setBatchCode("LH000001");
        stocktakeDetailDto.setProductId(1L);
        stocktakeDetailDto.setProductCode("TP001");
        stocktakeDetailDto.setProductName("Test Product");
        stocktakeDetailDto.setDiff(-5); // Thiếu 5 sản phẩm
        stocktakeDetailDto.setZoneReal("A1");
    }

    @Test
    void testConvertStocktakeDetailToProductSale_WithValidData() {
        // Given
        when(importTransactionDetailRepository.findById(100L))
                .thenReturn(Optional.of(importTransactionDetail));

        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(stocktakeDetailDto);

        // When
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());

        ProductSaleResponseDto productSaleDto = result.get(0);
        assertEquals(100L, productSaleDto.getId());
        assertEquals(1L, productSaleDto.getProId());
        assertEquals("Test Product", productSaleDto.getProductName());
        assertEquals("TP001", productSaleDto.getProductCode());
        assertEquals(50, productSaleDto.getRemainQuantity());
        assertEquals(5, productSaleDto.getQuantity()); // Math.abs(-5)
        assertEquals(new BigDecimal("25000"), productSaleDto.getUnitSalePrice());
        assertEquals("Test Category", productSaleDto.getCategoryName());
        assertEquals("Test Store", productSaleDto.getStoreName());
        assertEquals("LH000001", productSaleDto.getName());
        assertEquals("LH000001", productSaleDto.getBatchCode());
        assertEquals("A1", productSaleDto.getZoneReal());
    }

    @Test
    void testConvertStocktakeDetailToProductSale_WithZeroDiff() {
        // Given
        stocktakeDetailDto.setDiff(0); // Không có chênh lệch
        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(stocktakeDetailDto);

        // When
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);

        // Then
        assertNotNull(result);
        assertEquals(0, result.size()); // Không có item nào được chuyển đổi
    }

    @Test
    void testConvertStocktakeDetailToProductSale_WithPositiveDiff() {
        // Given
        stocktakeDetailDto.setDiff(3); // Dư hàng (không nên xuất hiện trong phiếu cân bằng)
        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(stocktakeDetailDto);

        // When
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);

        // Then
        assertNotNull(result);
        assertEquals(0, result.size()); // Không có item nào được trả về vì chỉ lấy diff âm
    }

    @Test
    void testConvertStocktakeDetailToProductSale_WithNullDiff() {
        // Given
        stocktakeDetailDto.setDiff(null);
        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(stocktakeDetailDto);

        // When
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);

        // Then
        assertNotNull(result);
        assertEquals(0, result.size());
    }

    @Test
    void testConvertStocktakeDetailToProductSale_ImportDetailNotFoundById() {
        // Given
        when(importTransactionDetailRepository.findById(100L))
                .thenReturn(Optional.empty());
        when(importTransactionDetailRepository.findByName("LH000001"))
                .thenReturn(importTransactionDetail);

        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(stocktakeDetailDto);

        // When
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        
        ProductSaleResponseDto productSaleDto = result.get(0);
        assertEquals(100L, productSaleDto.getId());
        assertEquals("Test Product", productSaleDto.getProductName());
        assertEquals(new BigDecimal("25000"), productSaleDto.getUnitSalePrice());
    }

    @Test
    void testConvertStocktakeDetailToProductSale_FallbackToProduct() {
        // Given
        when(importTransactionDetailRepository.findById(100L))
                .thenReturn(Optional.empty());
        when(importTransactionDetailRepository.findByName("LH000001"))
                .thenReturn(null);
        when(productRepository.findById(1L))
                .thenReturn(Optional.of(product));

        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(stocktakeDetailDto);

        // When
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        
        ProductSaleResponseDto productSaleDto = result.get(0);
        assertEquals(0L, productSaleDto.getId()); // Không có ImportTransactionDetail ID
        assertEquals(1L, productSaleDto.getProId());
        assertEquals("Test Product", productSaleDto.getProductName());
        assertEquals("TP001", productSaleDto.getProductCode());
        assertEquals(BigDecimal.ZERO, productSaleDto.getUnitSalePrice()); // Không có giá bán
        assertEquals("Test Category", productSaleDto.getCategoryName());
        assertEquals("Test Store", productSaleDto.getStoreName());
    }

    @Test
    void testConvertStocktakeDetailToProductSale_MultipleItems() {
        // Given
        StocktakeDetailDto stocktakeDetail2 = new StocktakeDetailDto();
        stocktakeDetail2.setId(101L);
        stocktakeDetail2.setBatchCode("LH000002");
        stocktakeDetail2.setProductId(2L);
        stocktakeDetail2.setDiff(-3);

        ImportTransactionDetail importDetail2 = new ImportTransactionDetail();
        importDetail2.setId(101L);
        importDetail2.setProduct(product);
        importDetail2.setUnitSalePrice(new BigDecimal("30000"));
        importDetail2.setName("LH000002");

        when(importTransactionDetailRepository.findById(100L))
                .thenReturn(Optional.of(importTransactionDetail));
        when(importTransactionDetailRepository.findById(101L))
                .thenReturn(Optional.of(importDetail2));

        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(stocktakeDetailDto, stocktakeDetail2);

        // When
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        
        // Kiểm tra item đầu tiên
        ProductSaleResponseDto firstItem = result.get(0);
        assertEquals(5, firstItem.getQuantity());
        assertEquals(new BigDecimal("25000"), firstItem.getUnitSalePrice());
        
        // Kiểm tra item thứ hai
        ProductSaleResponseDto secondItem = result.get(1);
        assertEquals(3, secondItem.getQuantity());
        assertEquals(new BigDecimal("30000"), secondItem.getUnitSalePrice());
    }

    @Test
    void testConvertStocktakeDetailToProductSale_MixedDiffValues() {
        // Given - Tạo mix của diff âm, dương và 0
        StocktakeDetailDto negativeDiff = new StocktakeDetailDto();
        negativeDiff.setId(100L);
        negativeDiff.setDiff(-5); // Thiếu hàng - nên được lấy

        StocktakeDetailDto positiveDiff = new StocktakeDetailDto();
        positiveDiff.setId(101L);
        positiveDiff.setDiff(3); // Dư hàng - không nên được lấy

        StocktakeDetailDto zeroDiff = new StocktakeDetailDto();
        zeroDiff.setId(102L);
        zeroDiff.setDiff(0); // Không chênh lệch - không nên được lấy

        when(importTransactionDetailRepository.findById(100L))
                .thenReturn(Optional.of(importTransactionDetail));

        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(negativeDiff, positiveDiff, zeroDiff);

        // When
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size()); // Chỉ có 1 item với diff âm được trả về

        ProductSaleResponseDto item = result.get(0);
        assertEquals(5, item.getQuantity()); // Math.abs(-5)
    }
}
