package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.services.StoreService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class StoreController {
    private static final Logger logger = LogManager.getLogger(StoreController.class);

    @Autowired
    private StoreService storeService;

    @GetMapping("/admin/storeList")
    public List<StoreResponseDto> getAllStores() {
        logger.info("Fetching all stores from table 'store'");
        try {
            List<Store> stores = storeService.getAllStores();
            logger.info("Found {} stores", stores.size());
            return stores.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching stores: {}", e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/store/{id}")
    public ResponseEntity<StoreResponseDto> getStoreById(@PathVariable Long id) {
        logger.info("Fetching store with id: {}", id);
        return storeService.getStoreById(id)
                .map(store -> ResponseEntity.ok(convertToResponseDTO(store)))
                .orElseThrow(() -> new UserManagementException("Store not found with id: " + id));
    }

    @PostMapping("/store")
    public StoreResponseDto createStore(@Valid @RequestBody StoreRequestDto dto) {
        logger.info("Creating new store: {}", dto.getName());
        Store store = storeService.convertToEntity(dto);
        Store savedStore = storeService.saveStore(store);
        return convertToResponseDTO(savedStore);
    }

    @PutMapping("/store/{id}")
    public ResponseEntity<StoreResponseDto> updateStore(@PathVariable Long id, @Valid @RequestBody StoreRequestDto dto) {
        logger.info("Updating store with id: {}", id);
        Store store = storeService.convertToEntity(dto);
        return storeService.updateStore(id, store)
                .map(updatedStore -> ResponseEntity.ok(convertToResponseDTO(updatedStore)))
                .orElseThrow(() -> new UserManagementException("Store not found with id: " + id));
    }

    @DeleteMapping("/store/{id}")
    public ResponseEntity<Void> deleteStore(@PathVariable Long id) {
        logger.info("Deleting store with id: {}", id);
        if (storeService.deleteStore(id)) {
            logger.info("Store with id {} deleted successfully", id);
            return ResponseEntity.ok().build();
        }
        throw new UserManagementException("Store not found with id: " + id);
    }

    private StoreResponseDto convertToResponseDTO(Store store) {
        try {
            StoreResponseDto dto = new StoreResponseDto();
            dto.setId(store.getId());
            dto.setName(store.getStoreName() != null ? store.getStoreName() : "");
            dto.setDescription(store.getStoreDescription() != null ? store.getStoreDescription() : "");
            dto.setAddress(store.getStoreAddress() != null ? store.getStoreAddress() : "");
            dto.setCreateAt(store.getCreatedAt());
            dto.setUpdateAt(store.getUpdatedAt());
            return dto;
        } catch (Exception e) {
            logger.error("Error converting store to DTO: {}", e.getMessage(), e);
            throw e;
        }
    }

    @ExceptionHandler(UserManagementException.class)
    public ResponseEntity<String> handleUserManagementException(UserManagementException ex) {
        logger.error("Error: {}", ex.getMessage());
        return ResponseEntity.status(404).body(ex.getMessage());
    }
}