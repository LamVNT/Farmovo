package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.services.StoreService;
import com.farmovo.backend.repositories.UserRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class StoreController {
    private static final Logger logger = LogManager.getLogger(StoreController.class);

    @Autowired
    private StoreService storeService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/admin/storeList")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN','ROLE_OWNER','OWNER')")
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

    @GetMapping("/stores")
    public List<StoreResponseDto> getAllStoresForAuthenticatedUsers() {
        logger.info("Fetching all stores for authenticated users");
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
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public StoreResponseDto createStore(@Valid @RequestBody StoreRequestDto dto, Principal principal) {
        logger.info("Creating new store: {}", dto.getStoreName());
        Store store = storeService.convertToEntity(dto);
        try {
            String username = principal.getName();
            Long userId = userRepository.findByUsernameAndDeletedAtIsNull(username)
                .map(user -> user.getId())
                .orElse(null);
            store.setCreatedBy(userId);
        } catch (Exception e) {
            logger.warn("Could not get userId from principal, createdBy will be null");
        }
        Store savedStore = storeService.saveStore(store);
        return convertToResponseDTO(savedStore);
    }

    @PutMapping("/store/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
    public ResponseEntity<StoreResponseDto> updateStore(@PathVariable Long id, @Valid @RequestBody StoreRequestDto dto) {
        logger.info("Updating store with id: {}", id);
        Store store = storeService.convertToEntity(dto);
        return storeService.updateStore(id, store)
                .map(updatedStore -> ResponseEntity.ok(convertToResponseDTO(updatedStore)))
                .orElseThrow(() -> new UserManagementException("Store not found with id: " + id));
    }

    @DeleteMapping("/store/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ADMIN')")
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
            dto.setStoreName(store.getStoreName() != null ? store.getStoreName() : "");
            dto.setStoreDescription(store.getStoreDescription() != null ? store.getStoreDescription() : "");
            dto.setStoreAddress(store.getStoreAddress() != null ? store.getStoreAddress() : "");
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