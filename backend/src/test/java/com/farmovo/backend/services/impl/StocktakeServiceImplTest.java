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
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
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

    private StocktakeRequestDto requestDto;
    private User user;
    private Store store;
    private Stocktake stocktake;
    private ImportTransactionDetail importDetail;
    private Product product;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        requestDto = createSampleStocktakeRequest();
        user = createSampleUser();
        store = createSampleStore();
        stocktake = createSampleStocktake();
        importDetail = createSampleImportDetail();
        product = createSampleProduct();

        // ✅ Bổ sung stub cần thiết cho product
        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
    }

    private StocktakeRequestDto createSampleStocktakeRequest() {
        StocktakeRequestDto dto = new StocktakeRequestDto();
        dto.setStatus("DRAFT");
        StocktakeDetailDto detail = new StocktakeDetailDto();
        detail.setBatchCode("LOT001");
        detail.setProductId(1L);
        detail.setReal(10);
        detail.setZoneReal("1");
        dto.setDetail(List.of(detail));
        return dto;
    }

    private User createSampleUser() {
        User u = new User();
        u.setId(1L);
        u.setAuthorities(List.of(new Authority("ROLE_OWNER")));
        return u;
    }

    private Store createSampleStore() {
        Store s = new Store();
        s.setId(1L);
        return s;
    }

    private Stocktake createSampleStocktake() {
        Stocktake s = new Stocktake();
        s.setId(1L);
        s.setStatus(StocktakeStatus.DRAFT);
        s.setStore(store);
        s.setCreatedBy(1L);
        s.setDetail("[]");
        return s;
    }

    private ImportTransactionDetail createSampleImportDetail() {
        ImportTransactionDetail d = new ImportTransactionDetail();
        d.setId(1L);
        d.setName("LOT001");
        d.setRemainQuantity(5);
        d.setIsCheck(false);
        d.setZones_id("1");
        return d;
    }

    private Product createSampleProduct() {
        Product p = new Product();
        p.setId(1L);
        p.setProductName("Gà");
        return p;
    }

    @Test
    void createStocktake_success() throws JsonProcessingException {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(storeRepository.findById(anyLong())).thenReturn(Optional.of(store));
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(stocktakeRepository.save(any())).thenReturn(stocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");

        StocktakeResponseDto result = stocktakeService.createStocktake(requestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    @Test
    void createStocktake_missingDetail_shouldThrow() throws JsonProcessingException {
        requestDto.setDetail(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> stocktakeService.createStocktake(requestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("detail is required");
    }

    @Test
    void createStocktake_userNotFound_shouldThrow() throws JsonProcessingException {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> stocktakeService.createStocktake(requestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void createStocktake_statusCompleted_shouldUpdateImportDetails() throws JsonProcessingException {
        requestDto.setStatus("COMPLETED");
        StocktakeDetailDto detail = requestDto.getDetail().get(0);
        detail.setBatchCode("LOT001");
        detail.setProductId(1L);
        detail.setReal(10);
        detail.setZoneReal("1");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(storeRepository.findById(anyLong())).thenReturn(Optional.of(store));
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(stocktakeRepository.save(any())).thenReturn(stocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());
        when(objectMapper.writeValueAsString(any())).thenReturn("[{\"batchCode\":\"LOT001\",\"productId\":1,\"real\":10,\"zoneReal\":\"1\"}]");
        when(objectMapper.readValue(eq("[{\"batchCode\":\"LOT001\",\"productId\":1,\"real\":10,\"zoneReal\":\"1\"}]"), eq(new TypeReference<List<StocktakeDetailDto>>() {
        })))
                .thenReturn(requestDto.getDetail());
        when(importTransactionDetailRepository.findByNameIn(anyList())).thenReturn(List.of(importDetail));

        StocktakeResponseDto result = stocktakeService.createStocktake(requestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
        verify(importTransactionDetailRepository).findByNameIn(anyList());
        verify(importTransactionDetailRepository).saveAndFlush(importDetail);
        assertThat(importDetail.getRemainQuantity()).isEqualTo(10);
        assertThat(importDetail.getIsCheck()).isTrue();
        assertThat(importDetail.getZones_id()).isEqualTo("1");
    }

    @Test
    void createStocktake_userRoleStaff_shouldUseUserStore() throws JsonProcessingException {
        user.setAuthorities(List.of(new Authority("ROLE_STAFF")));
        user.setStore(store);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(stocktakeRepository.findMaxId()).thenReturn(0L);
        when(stocktakeRepository.save(any())).thenReturn(stocktake);
        when(stocktakeMapper.toResponseDto(any())).thenReturn(new StocktakeResponseDto());
        when(objectMapper.writeValueAsString(any())).thenReturn("[]");

        StocktakeResponseDto result = stocktakeService.createStocktake(requestDto, 1L);

        assertThat(result).isNotNull();
        verify(stocktakeRepository).save(any());
    }

    @Test
    void createStocktake_userRoleStaff_noStore_shouldThrow() throws JsonProcessingException {
        user.setAuthorities(List.of(new Authority("ROLE_STAFF")));
        user.setStore(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> stocktakeService.createStocktake(requestDto, 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("User does not have a store assigned");
    }

    @Test
    void createStocktake_userRoleUnknown_shouldThrow() throws JsonProcessingException {
        user.setAuthorities(List.of(new Authority("ROLE_UNKNOWN")));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> stocktakeService.createStocktake(requestDto, 1L))
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
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(stocktake));
        when(stocktakeMapper.toResponseDto(stocktake)).thenReturn(new StocktakeResponseDto());
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
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(stocktake));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> stocktakeService.updateStocktakeStatus(1L, "COMPLETED", 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void updateStocktakeStatus_invalidTransition_shouldThrow() throws JsonProcessingException {
        stocktake.setStatus(StocktakeStatus.COMPLETED);
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(stocktake));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        assertThatThrownBy(() -> stocktakeService.updateStocktakeStatus(1L, "CANCELLED", 1L))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Không thể hủy phiếu đã được duyệt hoàn thành!");
    }

    @Test
    void updateStocktake_notFound_shouldThrow() throws JsonProcessingException {
        when(stocktakeRepository.findById(2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> stocktakeService.updateStocktake(2L, requestDto))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Stocktake not found");
    }

    @Test
    void updateStocktake_completedOrCancelled_shouldThrow() throws JsonProcessingException {
        stocktake.setStatus(StocktakeStatus.COMPLETED);
        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(stocktake));
        assertThatThrownBy(() -> stocktakeService.updateStocktake(1L, requestDto))
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