package com.farmovo.backend.services.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.exceptions.ValidationException;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StocktakeServiceImplTest {

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

    @InjectMocks
    private StocktakeServiceImpl stocktakeService;

    private StocktakeRequestDto validRequestDto;
    private User validUser;
    private Store validStore;
    private Stocktake validStocktake;
    private ImportTransactionDetail validImportDetail;
    private Product validProduct;
    private StocktakeDetailDto validDetailDto;

    @BeforeEach
    void setup() {
        // Setup test data
        validDetailDto = new StocktakeDetailDto();
        validDetailDto.setBatchCode("LOT001");
        validDetailDto.setProductId(1L);
        validDetailDto.setReal(10);
        validDetailDto.setZoneReal("1");

        validRequestDto = new StocktakeRequestDto();
        validRequestDto.setStatus("DRAFT");
        validRequestDto.setStoreId(1L);
        validRequestDto.setDetail(List.of(validDetailDto));

        validUser = new User();
        validUser.setId(1L);
        validUser.setAuthorities(List.of(new Authority("ROLE_OWNER")));

        validStore = new Store();
        validStore.setId(1L);

        validStocktake = new Stocktake();
        validStocktake.setId(1L);
        validStocktake.setStatus(StocktakeStatus.DRAFT);
        validStocktake.setStore(validStore);
        validStocktake.setCreatedBy(1L);
        validStocktake.setDetail("[]");

        validImportDetail = new ImportTransactionDetail();
        validImportDetail.setId(1L);
        validImportDetail.setName("LOT001");
        validImportDetail.setRemainQuantity(5);
        validImportDetail.setIsCheck(false);
        validImportDetail.setZones_id("1");

        validProduct = new Product();
        validProduct.setId(1L);
        validProduct.setProductName("Gà");

        // Setup common mocks
        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));
    }

    @Test
    void createStocktake_success() throws JsonProcessingException {
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        when(storeRepository.findById(anyLong())).thenReturn(Optional.of(validStore));
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(stocktakeRepository.save(any())).thenReturn(validStocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");

        StocktakeResponseDto result = stocktakeService.createStocktake(validRequestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    @Test
    void createStocktake_missingDetail_shouldThrow() throws JsonProcessingException {
        validRequestDto.setDetail(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        
        assertThatThrownBy(() -> stocktakeService.createStocktake(validRequestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("detail is required");
    }

    @Test
    void createStocktake_userNotFound_shouldThrow() throws JsonProcessingException {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> stocktakeService.createStocktake(validRequestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void createStocktake_statusCompleted_shouldUpdateImportDetails() throws JsonProcessingException {
        validRequestDto.setStatus("COMPLETED");
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        when(storeRepository.findById(anyLong())).thenReturn(Optional.of(validStore));
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(stocktakeRepository.save(any())).thenReturn(validStocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());
        when(objectMapper.writeValueAsString(any())).thenReturn("[{\"batchCode\":\"LOT001\",\"productId\":1,\"real\":10,\"zoneReal\":\"1\"}]");
        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(validRequestDto.getDetail());
        when(importTransactionDetailRepository.findByNameIn(anyList())).thenReturn(List.of(validImportDetail));

        StocktakeResponseDto result = stocktakeService.createStocktake(validRequestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
        verify(importTransactionDetailRepository).findByNameIn(anyList());
        verify(importTransactionDetailRepository).saveAndFlush(validImportDetail);
        assertThat(validImportDetail.getRemainQuantity()).isEqualTo(10);
        assertThat(validImportDetail.getIsCheck()).isTrue();
        assertThat(validImportDetail.getZones_id()).isEqualTo("1");
    }

    @Test
    void createStocktake_userRoleStaff_shouldUseUserStore() throws JsonProcessingException {
        validUser.setAuthorities(List.of(new Authority("ROLE_STAFF")));
        validUser.setStore(validStore);
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(stocktakeRepository.save(any())).thenReturn(validStocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");

        StocktakeResponseDto result = stocktakeService.createStocktake(validRequestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    @Test
    void createStocktake_userRoleStaff_noStore_shouldThrow() throws JsonProcessingException {
        validUser.setAuthorities(List.of(new Authority("ROLE_STAFF")));
        validUser.setStore(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        
        assertThatThrownBy(() -> stocktakeService.createStocktake(validRequestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("User does not have a store assigned");
    }

    @Test
    void createStocktake_userRoleUnknown_shouldThrow() throws JsonProcessingException {
        validUser.setAuthorities(List.of(new Authority("ROLE_UNKNOWN")));
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        
        assertThatThrownBy(() -> stocktakeService.createStocktake(validRequestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Bạn không có quyền thực hiện thao tác này!");
    }

    @Test
    void getStocktakeById_notFound_shouldThrow() throws JsonProcessingException {
        when(stocktakeRepository.findById(2L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> stocktakeService.getStocktakeById(2L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Stocktake not found");
    }

    @Test
    void deleteStocktakeById_success() throws JsonProcessingException {
        doNothing().when(stocktakeRepository).deleteById(1L);
        
        stocktakeService.deleteStocktakeById(1L);
        
        verify(stocktakeRepository).deleteById(1L);
    }

    @Test
    void getAllStocktakes_userNotFound_shouldThrow() throws JsonProcessingException {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> stocktakeService.getAllStocktakes(null, null, null, null, null, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void getStocktakeById_success() throws JsonProcessingException {
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        when(stocktakeMapper.toResponseDto(validStocktake)).thenReturn(new StocktakeResponseDto());
        
        StocktakeResponseDto result = stocktakeService.getStocktakeById(1L);
        
        assertThat(result).isNotNull();
    }

    @Test
    void updateStocktakeStatus_notFound_shouldThrow() throws JsonProcessingException {
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> stocktakeService.updateStocktakeStatus(1L, "COMPLETED", 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Stocktake not found");
    }

    @Test
    void updateStocktakeStatus_userNotFound_shouldThrow() throws JsonProcessingException {
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> stocktakeService.updateStocktakeStatus(1L, "COMPLETED", 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void updateStocktakeStatus_invalidTransition_shouldThrow() throws JsonProcessingException {
        validStocktake.setStatus(StocktakeStatus.COMPLETED);
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        when(userRepository.findById(1L)).thenReturn(Optional.of(validUser));
        
        assertThatThrownBy(() -> stocktakeService.updateStocktakeStatus(1L, "CANCELLED", 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Không thể hủy phiếu đã được duyệt hoàn thành!");
    }

    @Test
    void updateStocktake_notFound_shouldThrow() throws JsonProcessingException {
        when(stocktakeRepository.findById(2L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> stocktakeService.updateStocktake(2L, validRequestDto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Stocktake not found");
    }

    @Test
    void updateStocktake_completedOrCancelled_shouldThrow() throws JsonProcessingException {
        validStocktake.setStatus(StocktakeStatus.COMPLETED);
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
        
        assertThatThrownBy(() -> stocktakeService.updateStocktake(1L, validRequestDto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Không thể chỉnh sửa phiếu đã hoàn thành hoặc đã hủy!");
    }

    @Test
    void exportStocktakeToExcel_notFound_shouldThrow() throws JsonProcessingException {
        when(stocktakeRepository.findById(2L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> stocktakeService.exportStocktakeToExcel(2L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Stocktake not found");
    }
}