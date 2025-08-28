package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.ImportBalanceDataDto;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.BalanceStockService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BalanceStockServiceImplTest {

    @Mock
    private StocktakeRepository stocktakeRepository;

    @Mock
    private SaleTransactionRepository saleTransactionRepository;

    @Mock
    private ImportTransactionDetailRepository importTransactionDetailRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private BalanceStockServiceImpl balanceStockService;

    private Stocktake validStocktake;
    private Store validStore;
    private Product validProduct;
    private ImportTransactionDetail validImportDetail;
    private StocktakeDetailDto shortageDetailDto;
    private StocktakeDetailDto surplusDetailDto;
    private StocktakeDetailDto neutralDetailDto;

    @BeforeEach
    void setup() {
        // Setup test data
        validStore = new Store();
        validStore.setId(1L);
        validStore.setStoreName("Store A");

        validProduct = new Product();
        validProduct.setId(1L);
        validProduct.setProductName("Product A");
        validProduct.setProductCode("PA001");
        validProduct.setCategory(new Category());
        validProduct.getCategory().setCategoryName("Category A");
        validProduct.setStore(validStore);

        validImportDetail = new ImportTransactionDetail();
        validImportDetail.setId(1L);
        validImportDetail.setName("LOT001");
        validImportDetail.setRemainQuantity(10);
        validImportDetail.setUnitImportPrice(new BigDecimal("1000"));
        validImportDetail.setUnitSalePrice(new BigDecimal("1500"));
        validImportDetail.setZones_id("1,2");
        validImportDetail.setExpireDate(LocalDateTime.now().plusDays(30));

        validStocktake = new Stocktake();
        validStocktake.setId(1L);
        validStocktake.setName("KK000001");
        validStocktake.setStore(validStore);

        // Setup detail DTOs with different diff scenarios
        shortageDetailDto = new StocktakeDetailDto();
        shortageDetailDto.setId(1L);
        shortageDetailDto.setBatchCode("LOT001");
        shortageDetailDto.setProductId(1L);
        shortageDetailDto.setProductName("Product A");
        shortageDetailDto.setProductCode("PA001");
        shortageDetailDto.setRemain(10);
        shortageDetailDto.setReal(5);
        shortageDetailDto.setDiff(-5); // Thiếu hàng
        shortageDetailDto.setZoneReal("1");

        surplusDetailDto = new StocktakeDetailDto();
        surplusDetailDto.setId(2L);
        surplusDetailDto.setBatchCode("LOT002");
        surplusDetailDto.setProductId(1L);
        surplusDetailDto.setProductName("Product A");
        surplusDetailDto.setProductCode("PA001");
        surplusDetailDto.setRemain(10);
        surplusDetailDto.setReal(15);
        surplusDetailDto.setDiff(5); // Thừa hàng
        surplusDetailDto.setZoneReal("2");

        neutralDetailDto = new StocktakeDetailDto();
        neutralDetailDto.setId(3L);
        neutralDetailDto.setBatchCode("LOT003");
        neutralDetailDto.setProductId(1L);
        neutralDetailDto.setProductName("Product A");
        neutralDetailDto.setProductCode("PA001");
        neutralDetailDto.setRemain(10);
        neutralDetailDto.setReal(10);
        neutralDetailDto.setDiff(0); // Không chênh lệch
        neutralDetailDto.setZoneReal("3");
    }

    // Test convertStocktakeDetailToProductSale - Chỉ xử lý diff âm (thiếu hàng)
    @Test
    void convertStocktakeDetailToProductSale_shortageItems_shouldReturnProductSaleDTOs() {
        List<StocktakeDetailDto> details = Arrays.asList(shortageDetailDto, surplusDetailDto, neutralDetailDto);
        
        when(importTransactionDetailRepository.findById(1L)).thenReturn(Optional.of(validImportDetail));
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));

        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(details);

        // Chỉ trả về items có diff âm (thiếu hàng)
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getQuantity()).isEqualTo(5); // Math.abs(-5)
        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
        assertThat(result.get(0).getUnitSalePrice()).isEqualTo(new BigDecimal("1500"));
    }

    @Test
    void convertStocktakeDetailToProductSale_noShortageItems_shouldReturnEmptyList() {
        List<StocktakeDetailDto> details = Arrays.asList(surplusDetailDto, neutralDetailDto);
        
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(details);

        assertThat(result).isEmpty();
    }

    @Test
    void convertStocktakeDetailToProductSale_importDetailNotFound_shouldUseProductFallback() {
        List<StocktakeDetailDto> details = Arrays.asList(shortageDetailDto);
        
        when(importTransactionDetailRepository.findById(1L)).thenReturn(Optional.empty());
        when(importTransactionDetailRepository.findByName("LOT001")).thenReturn(null);
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));

        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(details);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
        assertThat(result.get(0).getUnitSalePrice()).isEqualTo(BigDecimal.ZERO);
    }

    @Test
    void convertStocktakeDetailToProductSale_nullDiff_shouldSkipItem() {
        shortageDetailDto.setDiff(null);
        List<StocktakeDetailDto> details = Arrays.asList(shortageDetailDto);
        
        List<ProductSaleResponseDto> result = balanceStockService.convertStocktakeDetailToProductSale(details);

        assertThat(result).isEmpty();
    }

    // Test convertStocktakeDetailToImportDetail - Chỉ xử lý diff dương (thừa hàng)
    @Test
    void convertStocktakeDetailToImportDetail_surplusItems_shouldReturnImportDetailDTOs() {
        List<StocktakeDetailDto> details = Arrays.asList(shortageDetailDto, surplusDetailDto, neutralDetailDto);
        
        when(importTransactionDetailRepository.findById(2L)).thenReturn(Optional.of(validImportDetail));

        List<CreateImportTransactionRequestDto.DetailDto> result = balanceStockService.convertStocktakeDetailToImportDetail(details);

        // Chỉ trả về items có diff dương (thừa hàng)
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getImportQuantity()).isEqualTo(5);
        assertThat(result.get(0).getRemainQuantity()).isEqualTo(5);
        assertThat(result.get(0).getProductId()).isEqualTo(1L);
    }

    @Test
    void convertStocktakeDetailToImportDetail_noSurplusItems_shouldReturnEmptyList() {
        List<StocktakeDetailDto> details = Arrays.asList(shortageDetailDto, neutralDetailDto);
        
        List<CreateImportTransactionRequestDto.DetailDto> result = balanceStockService.convertStocktakeDetailToImportDetail(details);

        assertThat(result).isEmpty();
    }

    @Test
    void convertStocktakeDetailToImportDetail_originalLotNotFound_shouldUseDefaultPrices() {
        List<StocktakeDetailDto> details = Arrays.asList(surplusDetailDto);
        
        when(importTransactionDetailRepository.findById(2L)).thenReturn(Optional.empty());

        List<CreateImportTransactionRequestDto.DetailDto> result = balanceStockService.convertStocktakeDetailToImportDetail(details);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUnitImportPrice()).isEqualTo(BigDecimal.ZERO);
        assertThat(result.get(0).getUnitSalePrice()).isEqualTo(BigDecimal.ZERO);
    }

    // Test convertStocktakeDetailToImportBalanceData - Chỉ xử lý diff dương (thừa hàng)
    @Test
    void convertStocktakeDetailToImportBalanceData_surplusItems_shouldReturnImportBalanceData() {
        List<StocktakeDetailDto> details = Arrays.asList(shortageDetailDto, surplusDetailDto, neutralDetailDto);
        
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));
        when(importTransactionDetailRepository.findById(2L)).thenReturn(Optional.of(validImportDetail));

        List<ImportBalanceDataDto> result = balanceStockService.convertStocktakeDetailToImportBalanceData(details);

        // Chỉ trả về items có diff dương (thừa hàng)
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getImportQuantity()).isEqualTo(5);
        assertThat(result.get(0).getProductId()).isEqualTo(1L);
        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
    }

    @Test
    void convertStocktakeDetailToImportBalanceData_noSurplusItems_shouldReturnEmptyList() {
        List<StocktakeDetailDto> details = Arrays.asList(shortageDetailDto, neutralDetailDto);
        
        List<ImportBalanceDataDto> result = balanceStockService.convertStocktakeDetailToImportBalanceData(details);

        assertThat(result).isEmpty();
    }

    @Test
    void convertStocktakeDetailToImportBalanceData_productNotFound_shouldSkipItem() {
        List<StocktakeDetailDto> details = Arrays.asList(surplusDetailDto);
        
        when(productRepository.findById(1L)).thenReturn(Optional.empty());

        List<ImportBalanceDataDto> result = balanceStockService.convertStocktakeDetailToImportBalanceData(details);

        assertThat(result).isEmpty();
    }

    @Test
    void convertStocktakeDetailToImportBalanceData_targetLotFound_shouldUseLotData() {
        List<StocktakeDetailDto> details = Arrays.asList(surplusDetailDto);
        
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));
        when(importTransactionDetailRepository.findById(2L)).thenReturn(Optional.of(validImportDetail));

        List<ImportBalanceDataDto> result = balanceStockService.convertStocktakeDetailToImportBalanceData(details);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUnitImportPrice()).isEqualTo(new BigDecimal("1000"));
        assertThat(result.get(0).getUnitSalePrice()).isEqualTo(new BigDecimal("1500"));
        assertThat(result.get(0).getBatchCode()).isEqualTo("LOT002");
    }

    // Test buildSaleTransactionFromStocktake
    @Test
    void buildSaleTransactionFromStocktake_shouldCreateCorrectSaleTransaction() {
        ProductSaleResponseDto productSaleDto = new ProductSaleResponseDto();
        productSaleDto.setUnitSalePrice(new BigDecimal("1500"));
        productSaleDto.setQuantity(5);
        
        List<ProductSaleResponseDto> diffDetails = Arrays.asList(productSaleDto);
        
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));

        CreateSaleTransactionRequestDto result = balanceStockService.buildSaleTransactionFromStocktake(1L, diffDetails, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getStoreId()).isEqualTo(1L);
        assertThat(result.getTotalAmount()).isEqualTo(new BigDecimal("7500")); // 1500 * 5
        assertThat(result.getPaidAmount()).isEqualTo(new BigDecimal("7500"));
        assertThat(result.getSaleTransactionNote()).isEqualTo("Cân bằng kho");
        assertThat(result.getStatus()).isEqualTo(SaleTransactionStatus.WAITING_FOR_APPROVE);
        assertThat(result.getDetail()).isEqualTo(diffDetails);
    }

    @Test
    void buildSaleTransactionFromStocktake_stocktakeNotFound_shouldThrowException() {
        when(stocktakeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> balanceStockService.buildSaleTransactionFromStocktake(999L, Arrays.asList(), 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stocktake not found");
    }

    // Test buildImportTransactionFromStocktake
    @Test
    void buildImportTransactionFromStocktake_shouldCreateCorrectImportTransaction() {
        CreateImportTransactionRequestDto.DetailDto importDetail = new CreateImportTransactionRequestDto.DetailDto();
        importDetail.setUnitImportPrice(new BigDecimal("1000"));
        importDetail.setImportQuantity(5);
        
        List<CreateImportTransactionRequestDto.DetailDto> importDetails = Arrays.asList(importDetail);
        
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));

        CreateImportTransactionRequestDto result = balanceStockService.buildImportTransactionFromStocktake(1L, importDetails, 1L);

        assertThat(result).isNotNull();
        assertThat(result.getStoreId()).isEqualTo(1L);
        assertThat(result.getTotalAmount()).isEqualTo(new BigDecimal("5000")); // 1000 * 5
        assertThat(result.getPaidAmount()).isEqualTo(new BigDecimal("5000"));
        assertThat(result.getImportTransactionNote()).isEqualTo("Cân bằng nhập");
        assertThat(result.getStatus()).isEqualTo(ImportTransactionStatus.DRAFT);
        assertThat(result.getStocktakeId()).isEqualTo(1L);
        assertThat(result.getDetails()).isEqualTo(importDetails);
    }

    @Test
    void buildImportTransactionFromStocktake_stocktakeNotFound_shouldThrowException() {
        when(stocktakeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> balanceStockService.buildImportTransactionFromStocktake(999L, Arrays.asList(), 1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Stocktake not found");
    }

    // Test updateZoneAndStockOnApprove
    @Test
    void updateZoneAndStockOnApprove_shouldUpdateImportDetails() {
        SaleTransaction saleTransaction = new SaleTransaction();
        saleTransaction.setId(1L);
        saleTransaction.setStocktakeId(1L);
        
        ProductSaleResponseDto productSaleDto = new ProductSaleResponseDto();
        productSaleDto.setId(1L);
        productSaleDto.setQuantity(5);
        productSaleDto.setZoneReal("2");
        
        // Convert the list to JSON string since SaleTransaction.detail is a String field
        try {
            String detailJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(Arrays.asList(productSaleDto));
            saleTransaction.setDetail(detailJson);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize detail to JSON", e);
        }
        
        when(saleTransactionRepository.findById(1L)).thenReturn(Optional.of(saleTransaction));
        when(importTransactionDetailRepository.findById(1L)).thenReturn(Optional.of(validImportDetail));

        balanceStockService.updateZoneAndStockOnApprove(1L);

        verify(importTransactionDetailRepository).saveAndFlush(validImportDetail);
        assertThat(validImportDetail.getZones_id()).isEqualTo("2");
        assertThat(validImportDetail.getRemainQuantity()).isEqualTo(5); // 10 - 5
    }

    @Test
    void updateZoneAndStockOnApprove_saleTransactionNotFound_shouldThrowException() {
        when(saleTransactionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> balanceStockService.updateZoneAndStockOnApprove(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("SaleTransaction not found");
    }

    @Test
    void updateZoneAndStockOnApprove_importDetailNotFound_shouldSkipUpdate() {
        SaleTransaction saleTransaction = new SaleTransaction();
        saleTransaction.setId(1L);
        saleTransaction.setStocktakeId(1L);
        
        ProductSaleResponseDto productSaleDto = new ProductSaleResponseDto();
        productSaleDto.setId(999L);
        productSaleDto.setQuantity(5);
        productSaleDto.setZoneReal("2");
        
        // Convert the list to JSON string since SaleTransaction.detail is a String field
        try {
            String detailJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(Arrays.asList(productSaleDto));
            saleTransaction.setDetail(detailJson);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize detail to JSON", e);
        }
        
        when(saleTransactionRepository.findById(1L)).thenReturn(Optional.of(saleTransaction));
        when(importTransactionDetailRepository.findById(999L)).thenReturn(Optional.empty());

        // Should not throw exception, just skip the update
        balanceStockService.updateZoneAndStockOnApprove(1L);

        verify(importTransactionDetailRepository, never()).saveAndFlush(any());
    }
}
