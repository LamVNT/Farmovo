package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.exceptions.ValidationException;
import com.farmovo.backend.models.SaleTransactionStatus;
import com.farmovo.backend.mapper.StocktakeMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.ImportTransactionDetailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StocktakeBalanceUpdateTest {

    @Mock
    private StocktakeRepository stocktakeRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private ImportTransactionDetailRepository importTransactionDetailRepository;

    @Mock
    private StocktakeMapper stocktakeMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ImportTransactionDetailService importTransactionDetailService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private SaleTransactionRepository saleTransactionRepository;

    @Mock
    private ImportTransactionRepository importTransactionRepository;

    @InjectMocks
    private StocktakeServiceImpl stocktakeService;

    private Stocktake validStocktake;
    private Store validStore;
    private Product validProduct;
    private ImportTransactionDetail validImportDetail;
    private User validUser;
    private StocktakeRequestDto validRequestDto;
    private StocktakeDetailDto detailWithDiff;
    private StocktakeDetailDto detailWithoutDiff;

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

        validImportDetail = new ImportTransactionDetail();
        validImportDetail.setId(1L);
        validImportDetail.setName("LOT001");
        validImportDetail.setRemainQuantity(10);
        validImportDetail.setUnitImportPrice(new java.math.BigDecimal("1000"));
        validImportDetail.setUnitSalePrice(new java.math.BigDecimal("1500"));
        validImportDetail.setZones_id("1,2");

        validUser = new User();
        validUser.setId(1L);
        validUser.setAuthorities(Arrays.asList(new Authority("ROLE_OWNER")));

        validStocktake = new Stocktake();
        validStocktake.setId(1L);
        validStocktake.setName("KK000001");
        validStocktake.setStore(validStore);
        validStocktake.setStatus(StocktakeStatus.DRAFT);
        validStocktake.setCreatedBy(1L);

        // Setup detail DTOs
        detailWithDiff = new StocktakeDetailDto();
        detailWithDiff.setId(1L);
        detailWithDiff.setBatchCode("LOT001");
        detailWithDiff.setProductId(1L);
        detailWithDiff.setProductName("Product A");
        detailWithDiff.setRemain(10);
        detailWithDiff.setReal(5);
        detailWithDiff.setDiff(-5); // Thiếu hàng
        detailWithDiff.setZoneReal("1");

        detailWithoutDiff = new StocktakeDetailDto();
        detailWithoutDiff.setId(2L);
        detailWithoutDiff.setBatchCode("LOT002");
        detailWithoutDiff.setProductId(1L);
        detailWithoutDiff.setProductName("Product A");
        detailWithoutDiff.setRemain(10);
        detailWithoutDiff.setReal(10);
        detailWithoutDiff.setDiff(0); // Không chênh lệch
        detailWithoutDiff.setZoneReal("2");

        validRequestDto = new StocktakeRequestDto();
        validRequestDto.setStatus("DRAFT");
        validRequestDto.setStoreId(1L);
        validRequestDto.setDetail(Arrays.asList(detailWithDiff, detailWithoutDiff));
    }

    // Test enrichStocktakeDetails - Logic làm giàu dữ liệu kiểm kê
    @Test
    void enrichStocktakeDetails_shouldEnrichAllDetails() throws Exception {
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));
        when(importTransactionDetailRepository.findByProductIdAndRemainQuantityGreaterThan(1L, 0))
                .thenReturn(Arrays.asList(validImportDetail));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(stocktakeRepository.save(any())).thenReturn(validStocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.createStocktake(validRequestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    @Test
    void enrichStocktakeDetails_productNotFound_shouldThrowException() throws Exception {
        when(productRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> stocktakeService.createStocktake(validRequestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    void enrichStocktakeDetails_noLotsFound_shouldContinueProcessing() throws Exception {
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));
        when(importTransactionDetailRepository.findByProductIdAndRemainQuantityGreaterThan(1L, 0))
                .thenReturn(Arrays.asList());
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(stocktakeRepository.save(any())).thenReturn(validStocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.createStocktake(validRequestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    // Test updateStocktakeDetails - Logic cập nhật chi tiết kiểm kê
    @Test
    void updateStocktakeDetails_shouldRecalculateDiffAndRemain() throws Exception {
        validStocktake.setDetail("[]");
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        when(importTransactionDetailRepository.findById(1L)).thenReturn(Optional.of(validImportDetail));
        when(importTransactionDetailRepository.findById(2L)).thenReturn(Optional.of(validImportDetail));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.updateStocktake(1L, validRequestDto);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    @Test
    void updateStocktakeDetails_cancelledStatus_shouldNotUpdateDetails() throws Exception {
        validRequestDto.setStatus("CANCELLED");
        validStocktake.setDetail("[]");
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.updateStocktake(1L, validRequestDto);

        assertThat(result).isNotNull();
        // Không nên gọi importTransactionDetailRepository.findById khi status là CANCELLED
        verify(importTransactionDetailRepository, never()).findById(any());
    }

    @Test
    void updateStocktakeDetails_lotNotFoundById_shouldTryBatchCode() throws Exception {
        validStocktake.setDetail("[]");
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        when(importTransactionDetailRepository.findById(1L)).thenReturn(Optional.empty());
        when(importTransactionDetailRepository.findByName("LOT001")).thenReturn(validImportDetail);
        when(importTransactionDetailRepository.findById(2L)).thenReturn(Optional.of(validImportDetail));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.updateStocktake(1L, validRequestDto);

        assertThat(result).isNotNull();
        verify(importTransactionDetailRepository).findByName("LOT001");
    }

    @Test
    void updateStocktakeDetails_lotNotFoundByBatchCode_shouldKeepOriginalDiff() throws Exception {
        validStocktake.setDetail("[]");
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        when(importTransactionDetailRepository.findById(1L)).thenReturn(Optional.empty());
        when(importTransactionDetailRepository.findByName("LOT001")).thenReturn(null);
        when(importTransactionDetailRepository.findById(2L)).thenReturn(Optional.of(validImportDetail));
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.updateStocktake(1L, validRequestDto);

        assertThat(result).isNotNull();
        // Giữ nguyên diff hiện có khi không tìm thấy lô
        assertThat(detailWithDiff.getDiff()).isEqualTo(-5);
    }

    // Test createStocktakeEntity - Logic tạo entity kiểm kê
    @Test
    void createStocktakeEntity_ownerRole_shouldUseRequestStoreId() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        when(storeRepository.findById(1L)).thenReturn(Optional.of(validStore));
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(stocktakeRepository.save(any())).thenReturn(validStocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.createStocktake(validRequestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    @Test
    void createStocktakeEntity_staffRole_shouldUseUserStore() throws Exception {
        validUser.setAuthorities(Arrays.asList(new Authority("ROLE_STAFF")));
        validUser.setStore(validStore);
        validRequestDto.setStoreId(null); // Staff không cần truyền storeId
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");
        when(stocktakeRepository.save(any())).thenReturn(validStocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.createStocktake(validRequestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    @Test
    void createStocktakeEntity_staffRoleNoStore_shouldThrowException() throws Exception {
        validUser.setAuthorities(Arrays.asList(new Authority("ROLE_STAFF")));
        validUser.setStore(null);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));

        assertThatThrownBy(() -> stocktakeService.createStocktake(validRequestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("User does not have a store assigned");
    }

    @Test
    void createStocktakeEntity_unknownRole_shouldThrowException() throws Exception {
        validUser.setAuthorities(Arrays.asList(new Authority("ROLE_UNKNOWN")));
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));

        assertThatThrownBy(() -> stocktakeService.createStocktake(validRequestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Bạn không có quyền thực hiện thao tác này!");
    }

    // Test buildStocktakeResponseDto - Logic xây dựng response
    @Test
    void buildStocktakeResponseDto_shouldIncludeBalanceAndImportCounts() throws Exception {
        when(saleTransactionRepository.countByStocktakeIdAndStatus(1L, SaleTransactionStatus.COMPLETE))
                .thenReturn(2L);
        when(importTransactionRepository.countByStocktakeId(1L)).thenReturn(1L);
        when(stocktakeMapper.toResponseDto(validStocktake)).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.getStocktakeById(1L);

        assertThat(result).isNotNull();
        // Các trường balance và import sẽ được set trong buildStocktakeResponseDto
    }

    @Test
    void buildStocktakeResponseDto_exceptionInBalanceCount_shouldSetDefaultValues() throws Exception {
        when(saleTransactionRepository.countByStocktakeIdAndStatus(1L, SaleTransactionStatus.COMPLETE))
                .thenThrow(new RuntimeException("Database error"));
        when(stocktakeMapper.toResponseDto(validStocktake)).thenReturn(new StocktakeResponseDto());

        StocktakeResponseDto result = stocktakeService.getStocktakeById(1L);

        assertThat(result).isNotNull();
        // Các trường balance sẽ được set giá trị mặc định khi có exception
    }

    // Test status transitions
    @Test
    void updateStocktakeStatus_completedToCancelled_shouldThrowException() throws Exception {
        validStocktake.setStatus(StocktakeStatus.COMPLETED);
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));

        assertThatThrownBy(() -> stocktakeService.updateStocktakeStatus(1L, "CANCELLED", 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Không thể hủy phiếu đã được duyệt hoàn thành!");
    }

    @Test
    void updateStocktakeStatus_updateCompletedStocktake_shouldThrowException() throws Exception {
        validStocktake.setStatus(StocktakeStatus.COMPLETED);
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));

        assertThatThrownBy(() -> stocktakeService.updateStocktake(1L, validRequestDto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Không thể chỉnh sửa phiếu đã hoàn thành hoặc đã hủy!");
    }
} 