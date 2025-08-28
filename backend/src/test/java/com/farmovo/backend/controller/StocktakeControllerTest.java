package com.farmovo.backend.controller;

import com.farmovo.backend.exceptions.GlobalExceptionHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.MissingZoneDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.services.ImportTransactionDetailService;
import com.farmovo.backend.services.StocktakeService;
import com.farmovo.backend.exceptions.ValidationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class StocktakeControllerTest {

    @Mock
    private StocktakeService stocktakeService;

    @Mock
    private ImportTransactionDetailService importTransactionDetailService;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private StocktakeController stocktakeController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private StocktakeRequestDto validRequestDto;
    private StocktakeResponseDto validResponseDto;
    private StocktakeDetailDto validDetailDto;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        mockMvc = MockMvcBuilders.standaloneSetup(stocktakeController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // Setup test data
        validDetailDto = new StocktakeDetailDto();
        validDetailDto.setBatchCode("LOT001");
        validDetailDto.setProductId(1L);
        validDetailDto.setReal(10);
        validDetailDto.setZoneReal("1");

        validRequestDto = new StocktakeRequestDto();
        validRequestDto.setStocktakeDate(Instant.now());
        validRequestDto.setStoreId(1L);
        validRequestDto.setStatus("DRAFT");
        validRequestDto.setDetail(List.of(validDetailDto));

        validResponseDto = new StocktakeResponseDto();
        validResponseDto.setId(1L);
        validResponseDto.setName("KK000001");
        validResponseDto.setStatus("DRAFT");

        // Mock JWT
        when(jwtUtils.getJwtFromRequest(any())).thenReturn("token");
        when(jwtUtils.getUserIdFromJwtToken(any())).thenReturn(1L);
    }

    @Test
    void createStocktake_success() throws Exception {
        when(stocktakeService.createStocktake(any(), anyLong())).thenReturn(validResponseDto);

        mockMvc.perform(post("/api/stocktakes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void getAllStocktakes_success() throws Exception {
        when(stocktakeService.getAllStocktakes(any(), any(), any(), any(), any(), anyLong()))
                .thenReturn(List.of(validResponseDto));

        mockMvc.perform(get("/api/stocktakes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void getStocktakesPaged_success() throws Exception {
        when(stocktakeService.searchStocktakes(any(), any(), any(), any(), any(), anyLong(), any()))
                .thenReturn(org.springframework.data.domain.Page.empty());

        mockMvc.perform(get("/api/stocktakes/paged")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk());
    }

    @Test
    void getStocktakeById_success() throws Exception {
        when(stocktakeService.getStocktakeById(1L)).thenReturn(validResponseDto);

        mockMvc.perform(get("/api/stocktakes/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void exportStocktakeToExcel_success() throws Exception {
        ByteArrayResource resource = new ByteArrayResource(new byte[]{1, 2, 3});
        when(stocktakeService.exportStocktakeToExcel(1L)).thenReturn(ResponseEntity.ok().body(resource));

        mockMvc.perform(get("/api/stocktakes/1/export-excel"))
                .andExpect(status().isOk());
    }

    @Test
    void updateStocktakeStatus_success() throws Exception {
        when(stocktakeService.updateStocktakeStatus(eq(1L), eq("COMPLETED"), anyLong()))
                .thenReturn(validResponseDto);

        mockMvc.perform(put("/api/stocktakes/1/status?status=COMPLETED"))
                .andExpect(status().isOk());
    }

    @Test
    void updateStocktake_success() throws Exception {
        when(stocktakeService.updateStocktake(eq(1L), any())).thenReturn(validResponseDto);

        mockMvc.perform(put("/api/stocktakes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequestDto)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteStocktake_success() throws Exception {
        doNothing().when(stocktakeService).deleteStocktakeById(1L);

        mockMvc.perform(delete("/api/stocktakes/1"))
                .andExpect(status().isOk());
    }

    @Test
    void getZonesWithProducts_success() throws Exception {
        ZoneResponseDto zoneDto = new ZoneResponseDto();
        zoneDto.setId(1L);
        zoneDto.setZoneName("Zone A");
        
        when(importTransactionDetailService.getZonesWithProducts()).thenReturn(List.of(zoneDto));

        mockMvc.perform(get("/api/stocktakes/zones-with-products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void getProductsByZone_success() throws Exception {
        ProductResponseDto productDto = new ProductResponseDto();
        productDto.setId(1L);
        productDto.setName("Product A");
        
        when(importTransactionDetailService.getProductsByZone(anyString())).thenReturn(List.of(productDto));

        mockMvc.perform(get("/api/stocktakes/products-by-zone?zoneId=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void checkMissingZones_success() throws Exception {
        MissingZoneDto missingZoneDto = new MissingZoneDto();
        missingZoneDto.setProductId(1L);
        missingZoneDto.setProductName("Product A");
        
        when(importTransactionDetailService.checkMissingZones(any())).thenReturn(List.of(missingZoneDto));

        mockMvc.perform(post("/api/stocktakes/check-missing-zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(validDetailDto))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].productId").value(1L));
    }

    @Test
    void getImportBalanceData_success() throws Exception {
        when(stocktakeService.getStocktakeById(1L)).thenReturn(validResponseDto);

        mockMvc.perform(get("/api/stocktakes/1/import-balance-data"))
                .andExpect(status().isOk());
    }

    // Error cases
    @Test
    void createStocktake_missingField_shouldReturnBadRequest() throws Exception {
        StocktakeRequestDto invalidRequest = new StocktakeRequestDto();
        
        mockMvc.perform(post("/api/stocktakes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createStocktake_serviceThrowsValidation_shouldReturnBadRequest() throws Exception {
        when(stocktakeService.createStocktake(any(), anyLong())).thenThrow(new ValidationException("detail is required"));

        mockMvc.perform(post("/api/stocktakes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequestDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getStocktakeById_notFound_shouldReturnBadRequest() throws Exception {
        when(stocktakeService.getStocktakeById(1L)).thenThrow(new ValidationException("Stocktake not found"));

        mockMvc.perform(get("/api/stocktakes/1"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateStocktakeStatus_invalidTransition_shouldReturnBadRequest() throws Exception {
        when(stocktakeService.updateStocktakeStatus(eq(1L), eq("CANCELLED"), anyLong()))
                .thenThrow(new ValidationException("Không thể hủy phiếu đã được duyệt hoàn thành"));

        mockMvc.perform(put("/api/stocktakes/1/status?status=CANCELLED"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateStocktake_notFound_shouldReturnBadRequest() throws Exception {
        when(stocktakeService.updateStocktake(eq(2L), any())).thenThrow(new ValidationException("Stocktake not found"));

        mockMvc.perform(put("/api/stocktakes/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequestDto)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteStocktake_notFound_shouldReturnBadRequest() throws Exception {
        doThrow(new ValidationException("Stocktake not found")).when(stocktakeService).deleteStocktakeById(2L);

        mockMvc.perform(delete("/api/stocktakes/2"))
                .andExpect(status().isBadRequest());
    }
}