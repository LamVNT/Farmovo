package com.farmovo.backend.controller;

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
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class StocktakeControllerTest {
    @Mock
    private StocktakeService stocktakeService;

    @Mock
    private ImportTransactionDetailService importTransactionDetailService;

    @Mock
    private JwtUtils jwtUtils;

    private MockMvc mockMvc;

    @InjectMocks
    private StocktakeController stocktakeController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockJwt(null);
        // Khởi tạo MockMvc thủ công mà không cần Spring context
        mockMvc = MockMvcBuilders.standaloneSetup(stocktakeController).build();
    }

    private void mockJwt(HttpServletRequest request) {
        when(jwtUtils.getJwtFromRequest(any())).thenReturn("token");
        when(jwtUtils.getUserIdFromJwtToken(any())).thenReturn(1L);
    }

    private StocktakeRequestDto createSampleStocktakeRequest() {
        StocktakeRequestDto req = new StocktakeRequestDto();
        req.setStocktakeDate(Instant.now());
        req.setStoreId(1L);
        req.setStatus("DRAFT");
        req.setDetail(List.of(new StocktakeDetailDto()));
        return req;
    }

    @Test
    void createStocktake_success() throws Exception {
        StocktakeRequestDto req = createSampleStocktakeRequest();
        when(stocktakeService.createStocktake(any(), anyLong())).thenReturn(new StocktakeResponseDto());

        mockMvc.perform(post("/api/stocktakes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void getAllStocktakes_success() throws Exception {
        when(stocktakeService.getAllStocktakes(any(), any(), any(), any(), any(), anyLong()))
                .thenReturn(List.of(new StocktakeResponseDto()));

        mockMvc.perform(get("/api/stocktakes"))
                .andExpect(status().isOk());
    }

    @Test
    void getStocktakeById_success() throws Exception {
        when(stocktakeService.getStocktakeById(1L)).thenReturn(new StocktakeResponseDto());

        mockMvc.perform(get("/api/stocktakes/1"))
                .andExpect(status().isOk());
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
                .thenReturn(new StocktakeResponseDto());

        mockMvc.perform(put("/api/stocktakes/1/status?status=COMPLETED"))
                .andExpect(status().isOk());
    }

    @Test
    void updateStocktake_success() throws Exception {
        StocktakeRequestDto req = createSampleStocktakeRequest();
        when(stocktakeService.updateStocktake(eq(1L), any())).thenReturn(new StocktakeResponseDto());

        mockMvc.perform(put("/api/stocktakes/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
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
        when(importTransactionDetailService.getZonesWithProducts()).thenReturn(List.of(new ZoneResponseDto()));

        mockMvc.perform(get("/api/stocktakes/zones-with-products"))
                .andExpect(status().isOk());
    }

    @Test
    void getProductsByZone_success() throws Exception {
        when(importTransactionDetailService.getProductsByZone(anyString())).thenReturn(List.of(new ProductResponseDto()));

        mockMvc.perform(get("/api/stocktakes/products-by-zone?zoneId=1"))
                .andExpect(status().isOk());
    }

    @Test
    void checkMissingZones_success() throws Exception {
        when(importTransactionDetailService.checkMissingZones(any())).thenReturn(List.of(new MissingZoneDto()));

        mockMvc.perform(post("/api/stocktakes/check-missing-zones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(new StocktakeDetailDto()))))
                .andExpect(status().isOk());
    }

    @Test
    void createStocktake_missingField_shouldReturnBadRequest() throws Exception {
        StocktakeRequestDto req = new StocktakeRequestDto();
        mockMvc.perform(post("/api/stocktakes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createStocktake_serviceThrowsValidation_shouldReturnBadRequest() throws Exception {
        StocktakeRequestDto req = createSampleStocktakeRequest();
        when(stocktakeService.createStocktake(any(), anyLong())).thenThrow(new ValidationException("detail is required"));

        mockMvc.perform(post("/api/stocktakes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
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
        StocktakeRequestDto req = createSampleStocktakeRequest();
        when(stocktakeService.updateStocktake(eq(2L), any())).thenThrow(new ValidationException("Stocktake not found"));

        mockMvc.perform(put("/api/stocktakes/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteStocktake_notFound_shouldReturnBadRequest() throws Exception {
        doThrow(new ValidationException("Stocktake not found")).when(stocktakeService).deleteStocktakeById(2L);

        mockMvc.perform(delete("/api/stocktakes/2"))
                .andExpect(status().isBadRequest());
    }
}