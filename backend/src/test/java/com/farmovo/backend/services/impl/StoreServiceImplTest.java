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

    // ========== STORE CREATION TESTS BASED ON UTCID01-UTCID10 ==========
    
    @Test
    @DisplayName("UTCID01: Normal - Valid store creation with FPT Mart")
    void testSaveStore_UTCID01_ValidStore_FPTMart() {
        // Arrange - UTCID01: Normal case with FPT Mart
        Store store = new Store();
        store.setStoreName("FPT Mart");
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress("An Khánh, Hoài Đức, Hà Nội");
        
        Store savedStore = new Store();
        savedStore.setId(1L);
        savedStore.setStoreName("FPT Mart");
        savedStore.setStoreDescription("Chi nhánh chính");
        savedStore.setStoreAddress("An Khánh, Hoài Đức, Hà Nội");
        
        given(storeRepository.save(any(Store.class))).willReturn(savedStore);
        
        // Act
        Store result = storeService.saveStore(store);
        
        // Assert
        assertNotNull(result);
        assertEquals("FPT Mart", result.getStoreName());
        assertEquals("Chi nhánh chính", result.getStoreDescription());
        assertEquals("An Khánh, Hoài Đức, Hà Nội", result.getStoreAddress());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID02: Boundary - Store name exactly 255 characters")
    void testSaveStore_UTCID02_StoreName_255Characters() {
        // Arrange - UTCID02: Boundary case - store name at max length
        String longName = "Mar...t" + "A".repeat(248); // Exactly 255 characters
        Store store = new Store();
        store.setStoreName(longName);
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress("Quận 2, TP.HCM");
        
        Store savedStore = new Store();
        savedStore.setId(2L);
        savedStore.setStoreName(longName);
        
        given(storeRepository.save(any(Store.class))).willReturn(savedStore);
        
        // Act
        Store result = storeService.saveStore(store);
        
        // Assert
        assertNotNull(result);
        assertEquals(255, result.getStoreName().length());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID03: Abnormal - Store name 256 characters (should fail)")
    void testSaveStore_UTCID03_StoreName_256Characters_ShouldFail() {
        // Arrange - UTCID03: Abnormal case - store name exceeds max length
        String tooLongName = "Mar...t" + "A".repeat(249); // Exactly 256 characters
        Store store = new Store();
        store.setStoreName(tooLongName);
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress("Hà nội....i(255 characters)");
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.saveStore(store));
        assertTrue(ex.getMessage().contains("Tên cửa hàng không vượt quá 255 kí tự"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    @DisplayName("UTCID04: Abnormal - Address 256 characters (should fail)")
    void testSaveStore_UTCID04_Address_256Characters_ShouldFail() {
        // Arrange - UTCID04: Abnormal case - address exceeds max length
        String tooLongAddress = "Quận 2 , tp.HC" + "M".repeat(242); // Exactly 256 characters
        Store store = new Store();
        store.setStoreName("B123 Mart");
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress(tooLongAddress);
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.saveStore(store));
        assertTrue(ex.getMessage().contains("Địa chỉ không vượt quá 255 kí tự"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    @DisplayName("UTCID05: Abnormal - Store name null (should fail)")
    void testSaveStore_UTCID05_StoreNameNull_ShouldFail() {
        // Arrange - UTCID05: Abnormal case - null store name
        Store store = new Store();
        store.setStoreName(null);
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress(null);
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.saveStore(store));
        assertTrue(ex.getMessage().contains("Tên cửa hàng không được để trống"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    @DisplayName("UTCID06: Boundary - Address exactly 255 characters")
    void testSaveStore_UTCID06_Address_255Characters() {
        // Arrange - UTCID06: Boundary case - address at max length
        String longAddress = "Quận 2 , tp.HC" + "M".repeat(241); // Exactly 255 characters
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress(longAddress);
        
        Store savedStore = new Store();
        savedStore.setId(6L);
        savedStore.setStoreAddress(longAddress);
        
        given(storeRepository.save(any(Store.class))).willReturn(savedStore);
        
        // Act
        Store result = storeService.saveStore(store);
        
        // Assert
        assertNotNull(result);
        assertEquals(255, result.getStoreAddress().length());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID07: Abnormal - Address null (should fail)")
    void testSaveStore_UTCID07_AddressNull_ShouldFail() {
        // Arrange - UTCID07: Abnormal case - null address
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress(null);
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.saveStore(store));
        assertTrue(ex.getMessage().contains("Địa chỉ không được để trống"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    @DisplayName("UTCID08: Normal - Valid store creation with Green Mart")
    void testSaveStore_UTCID08_ValidStore_GreenMart() {
        // Arrange - UTCID08: Normal case with Green Mart
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription("Chi nhánh rộng nhất....tt(255 characters)");
        store.setStoreAddress("Quận 2, TP.HCM");
        
        Store savedStore = new Store();
        savedStore.setId(8L);
        savedStore.setStoreName("Green Mart");
        savedStore.setStoreDescription("Chi nhánh rộng nhất....tt(255 characters)");
        savedStore.setStoreAddress("Quận 2, TP.HCM");
        
        given(storeRepository.save(any(Store.class))).willReturn(savedStore);
        
        // Act
        Store result = storeService.saveStore(store);
        
        // Assert
        assertNotNull(result);
        assertEquals("Green Mart", result.getStoreName());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID09: Boundary - Description exactly 255 characters")
    void testSaveStore_UTCID09_Description_255Characters() {
        // Arrange - UTCID09: Boundary case - description at max length
        String longDescription = "Chi nhánh rộng nhất....tt" + "A".repeat(230); // Exactly 255 characters
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription(longDescription);
        store.setStoreAddress("Quận 2, TP.HCM");
        
        Store savedStore = new Store();
        savedStore.setId(9L);
        savedStore.setStoreDescription(longDescription);
        
        given(storeRepository.save(any(Store.class))).willReturn(savedStore);
        
        // Act
        Store result = storeService.saveStore(store);
        
        // Assert
        assertNotNull(result);
        assertEquals(255, result.getStoreDescription().length());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID10: Abnormal - Description 256 characters (should fail)")
    void testSaveStore_UTCID10_Description_256Characters_ShouldFail() {
        // Arrange - UTCID10: Abnormal case - description exceeds max length
        String tooLongDescription = "Chi nhánh rộng nhất....tt" + "A".repeat(231); // Exactly 256 characters
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription(tooLongDescription);
        store.setStoreAddress("Quận 2, TP.HCM");
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.saveStore(store));
        assertTrue(ex.getMessage().contains("Mô tả không vượt quá 255 kí tự"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    // ========== STORE UPDATE TESTS BASED ON UTCID01-UTCID10 ==========
    
    @Test
    @DisplayName("UTCID01: Normal - Valid store update with FPT Mart")
    void testUpdateStore_UTCID01_ValidStore_FPTMart() {
        // Arrange - UTCID01: Normal case with FPT Mart
        Store store = new Store();
        store.setStoreName("FPT Mart");
        store.setStoreDescription(null);
        store.setStoreAddress("An Khánh, Hoài Đức, Hà Nội");
        
        Store updatedStore = new Store();
        updatedStore.setId(1L);
        updatedStore.setStoreName("FPT Mart");
        updatedStore.setStoreDescription(null);
        updatedStore.setStoreAddress("An Khánh, Hoài Đức, Hà Nội");
        
        given(storeRepository.existsById(1L)).willReturn(true);
        given(storeRepository.save(any(Store.class))).willReturn(updatedStore);
        
        // Act
        Optional<Store> result = storeService.updateStore(1L, store);
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals("FPT Mart", result.get().getStoreName());
        assertNull(result.get().getStoreDescription());
        assertEquals("An Khánh, Hoài Đức, Hà Nội", result.get().getStoreAddress());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID02: Boundary - Store name exactly 255 characters")
    void testUpdateStore_UTCID02_StoreName_255Characters() {
        // Arrange - UTCID02: Boundary case - store name at max length
        String longName = "Mar...t" + "A".repeat(248); // Exactly 255 characters
        Store store = new Store();
        store.setStoreName(longName);
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress("Quận 2, TP.HCM");
        
        Store updatedStore = new Store();
        updatedStore.setId(2L);
        updatedStore.setStoreName(longName);
        
        given(storeRepository.existsById(2L)).willReturn(true);
        given(storeRepository.save(any(Store.class))).willReturn(updatedStore);
        
        // Act
        Optional<Store> result = storeService.updateStore(2L, store);
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals(255, result.get().getStoreName().length());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID03: Abnormal - Store name 256 characters (should fail)")
    void testUpdateStore_UTCID03_StoreName_256Characters_ShouldFail() {
        // Arrange - UTCID03: Abnormal case - store name exceeds max length
        String tooLongName = "Mar...t" + "A".repeat(249); // Exactly 256 characters
        Store store = new Store();
        store.setStoreName(tooLongName);
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress("Quận 2, TP.HCM");
        
        given(storeRepository.existsById(3L)).willReturn(true);
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.updateStore(3L, store));
        assertTrue(ex.getMessage().contains("Tên cửa hàng không vượt quá 255 kí tự"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    @DisplayName("UTCID04: Abnormal - Address 256 characters (should fail)")
    void testUpdateStore_UTCID04_Address_256Characters_ShouldFail() {
        // Arrange - UTCID04: Abnormal case - address exceeds max length
        String tooLongAddress = "Quận 2 , tp.HC" + "M".repeat(242); // Exactly 256 characters
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress(tooLongAddress);
        
        given(storeRepository.existsById(4L)).willReturn(true);
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.updateStore(4L, store));
        assertTrue(ex.getMessage().contains("Địa chỉ không vượt quá 255 kí tự"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    @DisplayName("UTCID05: Abnormal - Store name null (should fail)")
    void testUpdateStore_UTCID05_StoreNameNull_ShouldFail() {
        // Arrange - UTCID05: Abnormal case - null store name
        Store store = new Store();
        store.setStoreName(null);
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress("Quận 2, TP.HCM");
        
        given(storeRepository.existsById(5L)).willReturn(true);
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.updateStore(5L, store));
        assertTrue(ex.getMessage().contains("Tên cửa hàng không được để trống"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    @DisplayName("UTCID06: Boundary - Address exactly 255 characters")
    void testUpdateStore_UTCID06_Address_255Characters() {
        // Arrange - UTCID06: Boundary case - address at max length
        String longAddress = "Quận 2 , tp.HC" + "M".repeat(241); // Exactly 255 characters
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress(longAddress);
        
        Store updatedStore = new Store();
        updatedStore.setId(6L);
        updatedStore.setStoreAddress(longAddress);
        
        given(storeRepository.existsById(6L)).willReturn(true);
        given(storeRepository.save(any(Store.class))).willReturn(updatedStore);
        
        // Act
        Optional<Store> result = storeService.updateStore(6L, store);
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals(255, result.get().getStoreAddress().length());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID07: Abnormal - Address null (should fail)")
    void testUpdateStore_UTCID07_AddressNull_ShouldFail() {
        // Arrange - UTCID07: Abnormal case - null address
        Store store = new Store();
        store.setStoreName("B123 Mart");
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress(null);
        
        given(storeRepository.existsById(7L)).willReturn(true);
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.updateStore(7L, store));
        assertTrue(ex.getMessage().contains("Địa chỉ không được để trống"));
        verify(storeRepository, never()).save(any(Store.class));
    }

    @Test
    @DisplayName("UTCID08: Normal - Valid store update with Green Mart")
    void testUpdateStore_UTCID08_ValidStore_GreenMart() {
        // Arrange - UTCID08: Normal case with Green Mart
        Store store = new Store();
        store.setStoreName("Mar...t(255 characters)");
        store.setStoreDescription("Chi nhánh chính");
        store.setStoreAddress("An Khánh, Hoài Đức, Hà Nội");
        
        Store updatedStore = new Store();
        updatedStore.setId(8L);
        updatedStore.setStoreName("Mar...t(255 characters)");
        updatedStore.setStoreDescription("Chi nhánh chính");
        updatedStore.setStoreAddress("An Khánh, Hoài Đức, Hà Nội");
        
        given(storeRepository.existsById(8L)).willReturn(true);
        given(storeRepository.save(any(Store.class))).willReturn(updatedStore);
        
        // Act
        Optional<Store> result = storeService.updateStore(8L, store);
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals("Mar...t(255 characters)", result.get().getStoreName());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID09: Boundary - Description exactly 255 characters")
    void testUpdateStore_UTCID09_Description_255Characters() {
        // Arrange - UTCID09: Boundary case - description at max length
        String longDescription = "Chi nhánh rộng nhất....tt" + "A".repeat(230); // Exactly 255 characters
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription(longDescription);
        store.setStoreAddress(null);
        
        Store updatedStore = new Store();
        updatedStore.setId(9L);
        updatedStore.setStoreDescription(longDescription);
        
        given(storeRepository.existsById(9L)).willReturn(true);
        given(storeRepository.save(any(Store.class))).willReturn(updatedStore);
        
        // Act
        Optional<Store> result = storeService.updateStore(9L, store);
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals(255, result.get().getStoreDescription().length());
        verify(storeRepository).save(store);
    }

    @Test
    @DisplayName("UTCID10: Abnormal - Description 256 characters (should fail)")
    void testUpdateStore_UTCID10_Description_256Characters_ShouldFail() {
        // Arrange - UTCID10: Abnormal case - description exceeds max length
        String tooLongDescription = "Chi nhánh rộng nhất....tt" + "A".repeat(231); // Exactly 256 characters
        Store store = new Store();
        store.setStoreName("Green Mart");
        store.setStoreDescription(tooLongDescription);
        store.setStoreAddress("Hà nội....i(255 characters)");
        
        given(storeRepository.existsById(10L)).willReturn(true);
        
        // Act & Assert
        Exception ex = assertThrows(UserManagementException.class, () -> storeService.updateStore(10L, store));
        assertTrue(ex.getMessage().contains("Mô tả không vượt quá 255 kí tự"));
        verify(storeRepository, never()).save(any(Store.class));
    }
} 