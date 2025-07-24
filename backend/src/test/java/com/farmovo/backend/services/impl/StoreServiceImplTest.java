package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.mapper.StoreMapper;
import com.farmovo.backend.models.Store;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

class StoreServiceImplTest {
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private StoreMapper storeMapper;

    @InjectMocks
    private StoreServiceImpl storeService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("getAllStores trả về danh sách store")
    void testGetAllStores() {
        Store store = new Store();
        List<Store> stores = Arrays.asList(store);
        given(storeRepository.findAll()).willReturn(stores);
        List<Store> result = storeService.getAllStores();
        assertEquals(1, result.size());
        verify(storeRepository).findAll();
    }

    @Test
    @DisplayName("getStoreById trả về store đúng id")
    void testGetStoreById() {
        Store store = new Store();
        store.setId(1L);
        given(storeRepository.findById(1L)).willReturn(Optional.of(store));
        Optional<Store> result = storeService.getStoreById(1L);
        assertTrue(result.isPresent());
        verify(storeRepository).findById(1L);
    }

    @Test
    @DisplayName("saveStore thành công")
    void testSaveStore() {
        Store store = new Store();
        store.setStoreName("Test Store");
        given(storeRepository.save(any(Store.class))).willReturn(store);
        Store result = storeService.saveStore(store);
        assertNotNull(result);
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("saveStore ném UserManagementException nếu thiếu tên")
    void testSaveStore_MissingName() {
        Store store = new Store();
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.saveStore(store));
        assertTrue(ex.getMessage().contains("Store name is required"));
    }

    @Test
    @DisplayName("updateStore thành công")
    void testUpdateStore() {
        Store store = new Store();
        store.setStoreName("Test Store");
        given(storeRepository.existsById(1L)).willReturn(true);
        given(storeRepository.save(any(Store.class))).willReturn(store);
        Optional<Store> result = storeService.updateStore(1L, store);
        assertTrue(result.isPresent());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("updateStore trả về empty nếu không tìm thấy id")
    void testUpdateStore_NotFound() {
        Store store = new Store();
        store.setStoreName("Test Store");
        given(storeRepository.existsById(2L)).willReturn(false);
        Optional<Store> result = storeService.updateStore(2L, store);
        assertFalse(result.isPresent());
    }

    @Test
    @DisplayName("updateStore ném UserManagementException nếu thiếu tên")
    void testUpdateStore_MissingName() {
        Store store = new Store();
        given(storeRepository.existsById(1L)).willReturn(true);
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.updateStore(1L, store));
        assertTrue(ex.getMessage().contains("Store name is required"));
    }

    @Test
    @DisplayName("deleteStore thành công")
    void testDeleteStore() {
        given(storeRepository.existsById(1L)).willReturn(true);
        doNothing().when(storeRepository).deleteById(1L);
        boolean result = storeService.deleteStore(1L);
        assertTrue(result);
        verify(storeRepository).deleteById(1L);
    }

    @Test
    @DisplayName("deleteStore trả về false nếu không tìm thấy id")
    void testDeleteStore_NotFound() {
        given(storeRepository.existsById(2L)).willReturn(false);
        boolean result = storeService.deleteStore(2L);
        assertFalse(result);
    }

    @Test
    @DisplayName("convertToEntity chuyển đúng dữ liệu")
    void testConvertToEntity() {
        StoreRequestDto dto = new StoreRequestDto();
        dto.setStoreName("Test Store");
        dto.setStoreDescription("Desc");
        dto.setStoreAddress("Addr");
        Store store = storeService.convertToEntity(dto);
        assertEquals("Test Store", store.getStoreName());
        assertEquals("Desc", store.getStoreDescription());
        assertEquals("Addr", store.getStoreAddress());
    }

    @Test
    @DisplayName("getAllStoreDto trả về danh sách dto")
    void testGetAllStoreDto() {
        Store store = new Store();
        List<Store> stores = Arrays.asList(store);
        List<StoreRequestDto> dtos = Arrays.asList(new StoreRequestDto());
        given(storeRepository.findAll()).willReturn(stores);
        given(storeMapper.toDtoList(stores)).willReturn(dtos);
        List<StoreRequestDto> result = storeService.getAllStoreDto();
        assertEquals(1, result.size());
        verify(storeRepository).findAll();
        verify(storeMapper).toDtoList(stores);
    }
} 