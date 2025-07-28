package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.jwt.AuthTokenFilter;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.services.StoreService;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = StoreController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class StoreControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StoreService storeService;

    @MockBean
    private AuthTokenFilter authTokenFilter;
    @MockBean
    private JwtUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    private Store store;
    private StoreRequestDto storeRequestDto;
    private StoreResponseDto storeResponseDto;

    @BeforeEach
    void setUp() {
        store = new Store();
        store.setId(1L);
        store.setStoreName("Test Store");
        store.setStoreDescription("Description");
        store.setStoreAddress("Address");
        store.setCreatedAt(LocalDateTime.now());
        store.setUpdatedAt(LocalDateTime.now());

        storeRequestDto = new StoreRequestDto();
        // set fields for storeRequestDto nếu cần

        storeResponseDto = new StoreResponseDto();
        storeResponseDto.setId(1L);
        storeResponseDto.setName("Test Store");
        storeResponseDto.setDescription("Description");
        storeResponseDto.setAddress("Address");
        storeResponseDto.setCreateAt(store.getCreatedAt());
        storeResponseDto.setUpdateAt(store.getUpdatedAt());
    }

    @Test
    @DisplayName("GET /api/admin/storeList - success")
    void testGetAllStores() throws Exception {
        given(storeService.getAllStores()).willReturn(Arrays.asList(store));

        mockMvc.perform(get("/api/admin/storeList"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/store/{id} - success")
    void testGetStoreById() throws Exception {
        given(storeService.getStoreById(1L)).willReturn(Optional.of(store));

        mockMvc.perform(get("/api/store/1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/store - success")
    void testCreateStore() throws Exception {
        given(storeService.convertToEntity(any(StoreRequestDto.class))).willReturn(store);
        given(storeService.saveStore(any(Store.class))).willReturn(store);

        mockMvc.perform(post("/api/store")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(storeRequestDto)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("PUT /api/store/{id} - success")
    void testUpdateStore() throws Exception {
        given(storeService.convertToEntity(any(StoreRequestDto.class))).willReturn(store);
        given(storeService.updateStore(eq(1L), any(Store.class))).willReturn(Optional.of(store));

        mockMvc.perform(put("/api/store/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(storeRequestDto)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/store/{id} - success")
    void testDeleteStore() throws Exception {
        given(storeService.deleteStore(1L)).willReturn(true);

        mockMvc.perform(delete("/api/store/1"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/store/{id} - not found")
    void testGetStoreById_NotFound() throws Exception {
        given(storeService.getStoreById(2L)).willReturn(Optional.empty());

        mockMvc.perform(get("/api/store/2"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/store/{id} - not found")
    void testUpdateStore_NotFound() throws Exception {
        given(storeService.convertToEntity(any(StoreRequestDto.class))).willReturn(store);
        given(storeService.updateStore(eq(2L), any(Store.class))).willReturn(Optional.empty());

        mockMvc.perform(put("/api/store/2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(storeRequestDto)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/store/{id} - not found")
    void testDeleteStore_NotFound() throws Exception {
        given(storeService.deleteStore(2L)).willReturn(false);

        mockMvc.perform(delete("/api/store/2"))
                .andExpect(status().isNotFound());
    }
} 