package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.ImportTransactionNotFoundException;
import com.farmovo.backend.jwt.AuthTokenFilter;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.services.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ImportTransationController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class ImportTransationControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerService customerService;
    @MockBean
    private ProductService productService;
    @MockBean
    private ZoneService zoneService;
    @MockBean
    private StoreService storeService;
    @MockBean
    private ImportTransactionService importTransactionService;
    @MockBean
    private JwtUtils jwtUtils;
    @MockBean
    private AuthTokenFilter authTokenFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
    }

    @Test
    @DisplayName("GET /api/import-transaction/create-form-data - success")
    void testGetCreateFormData() throws Exception {
        ImportTransactionCreateFormDataDto formData = new ImportTransactionCreateFormDataDto();
        given(customerService.getAllCustomerDto()).willReturn(Collections.emptyList());
        given(productService.getAllProductDto()).willReturn(Collections.emptyList());
        given(zoneService.getAllZoneDtos()).willReturn(Collections.emptyList());
        given(storeService.getAllStoreDto()).willReturn(Collections.emptyList());

        mockMvc.perform(get("/api/import-transaction/create-form-data"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/import-transaction/{id}/cancel - success")
    void testCancelImportTransaction() throws Exception {
        doNothing().when(importTransactionService).cancel(1L);
        mockMvc.perform(put("/api/import-transaction/1/cancel"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/import-transaction/{id}/open - success")
    void testOpenImportTransaction() throws Exception {
        doNothing().when(importTransactionService).open(1L);
        mockMvc.perform(put("/api/import-transaction/1/open"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/import-transaction/{id}/complete - success")
    void testCompleteImportTransaction() throws Exception {
        doNothing().when(importTransactionService).complete(1L);
        mockMvc.perform(put("/api/import-transaction/1/complete"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/import-transaction/{id}/close-transaction - success")
    void testCloseImportTransaction() throws Exception {
        doNothing().when(importTransactionService).close(1L);
        mockMvc.perform(put("/api/import-transaction/1/close-transaction"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/import-transaction/list-all - success")
    void testListAllImportTransaction() throws Exception {
        given(importTransactionService.listAllImportTransaction()).willReturn(Collections.emptyList());
        mockMvc.perform(get("/api/import-transaction/list-all"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/import-transaction/{id} - success")
    void testGetImportTransactionById() throws Exception {
        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
        given(importTransactionService.getImportTransactionById(1L)).willReturn(dto);
        mockMvc.perform(get("/api/import-transaction/1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/import-transaction/save - success")
    void testCreateImportTransaction() throws Exception {
        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
        given(jwtUtils.getJwtFromCookies(any(HttpServletRequest.class))).willReturn("token");
        given(jwtUtils.validateJwtToken(anyString())).willReturn(true);
        given(jwtUtils.getUserIdFromJwtToken(anyString())).willReturn(1L);
        doNothing().when(importTransactionService).createImportTransaction(any(CreateImportTransactionRequestDto.class), eq(1L));

        mockMvc.perform(post("/api/import-transaction/save")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/import-transaction/next-code - success")
    void testGetNextImportTransactionCode() throws Exception {
        given(importTransactionService.getNextImportTransactionCode()).willReturn("CODE123");
        mockMvc.perform(get("/api/import-transaction/next-code"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/import-transaction/sort-delete/{id} - success")
    void testSoftDeleteImportTransaction() throws Exception {
        given(jwtUtils.getJwtFromCookies(any(HttpServletRequest.class))).willReturn("token");
        given(jwtUtils.validateJwtToken(anyString())).willReturn(true);
        given(jwtUtils.getUserIdFromJwtToken(anyString())).willReturn(1L);
        doNothing().when(importTransactionService).softDeleteImportTransaction(eq(1L), eq(1L));

        mockMvc.perform(delete("/api/import-transaction/sort-delete/1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/import-transaction/{id} - success")
    void testUpdateImportTransaction() throws Exception {
        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
        doNothing().when(importTransactionService).update(eq(1L), any(CreateImportTransactionRequestDto.class));
        mockMvc.perform(put("/api/import-transaction/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/import-transaction/{id}/export - success")
    void testExportImportTransactionPdf() throws Exception {
        given(importTransactionService.exportImportPdf(1L)).willReturn(new byte[]{1,2,3});
        mockMvc.perform(get("/api/import-transaction/1/export"))
                .andExpect(status().isOk());
    }
} 