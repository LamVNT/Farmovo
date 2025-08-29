package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.mapper.StoreMapper;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.StoreService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StoreServiceImpl implements StoreService {
    private static final Logger logger = LogManager.getLogger(StoreServiceImpl.class);

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private StoreMapper storeMapper;

    @Override
    public List<Store> getAllStores() {
        logger.info("Retrieving all stores");
        return storeRepository.findAll();
    }
    @Override
    public Optional<Store> getStoreById(Long id) {
        logger.info("Retrieving store with id: {}", id);
        return storeRepository.findById(id);
    }
    @Override
    public Store saveStore(Store store) {
        logger.info("Saving new store: {}", store.getStoreName());
        try {
            // Validate store name
            if (store.getStoreName() == null || store.getStoreName().isBlank()) {
                throw new IllegalArgumentException("Tên cửa hàng không được để trống");
            }
            if (store.getStoreName().length() > 255) {
                throw new IllegalArgumentException("Tên cửa hàng không vượt quá 255 kí tự");
            }
            
            // Validate store address
            if (store.getStoreAddress() == null || store.getStoreAddress().isBlank()) {
                throw new IllegalArgumentException("Địa chỉ không được để trống");
            }
            if (store.getStoreAddress().length() > 255) {
                throw new IllegalArgumentException("Địa chỉ không vượt quá 255 kí tự");
            }
            
            // Validate store description (optional field but with length constraint)
            if (store.getStoreDescription() != null && store.getStoreDescription().length() > 255) {
                throw new IllegalArgumentException("Mô tả không vượt quá 255 kí tự");
            }
            
            return storeRepository.save(store);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            throw new UserManagementException(e.getMessage());
        }
    }
    @Override
    public Optional<Store> updateStore(Long id, Store store) {
        logger.info("Updating store with id: {}", id);
        if (storeRepository.existsById(id)) {
            try {
                // Validate store name
                if (store.getStoreName() == null || store.getStoreName().isBlank()) {
                    throw new IllegalArgumentException("Tên cửa hàng không được để trống");
                }
                if (store.getStoreName().length() > 255) {
                    throw new IllegalArgumentException("Tên cửa hàng không vượt quá 255 kí tự");
                }
                
                // Validate store address
                if (store.getStoreAddress() == null || store.getStoreAddress().isBlank()) {
                    throw new IllegalArgumentException("Địa chỉ không được để trống");
                }
                if (store.getStoreAddress().length() > 255) {
                    throw new IllegalArgumentException("Địa chỉ không vượt quá 255 kí tự");
                }
                
                // Validate store description (optional field but with length constraint)
                if (store.getStoreDescription() != null && store.getStoreDescription().length() > 255) {
                    throw new IllegalArgumentException("Mô tả không vượt quá 255 kí tự");
                }
                
                store.setId(id);
                return Optional.of(storeRepository.save(store));
            } catch (IllegalArgumentException e) {
                logger.error("Validation error: {}", e.getMessage());
                throw new UserManagementException(e.getMessage());
            }
        }
        logger.warn("Store with id {} not found for update", id);
        return Optional.empty();
    }

    @Override
    public boolean deleteStore(Long id) {
        logger.info("Attempting to delete store with id: {}", id);
        if (storeRepository.existsById(id)) {
            storeRepository.deleteById(id);
            logger.info("Store with id {} deleted successfully", id);
            return true;
        }
        logger.warn("Store with id {} not found for deletion", id);
        return false;
    }

    @Override
    public Store convertToEntity(StoreRequestDto dto) {
        logger.info("Converting StoreRequestDto to Store entity: {}", dto.getStoreName());
        Store store = new Store();
        store.setStoreName(dto.getStoreName());
        store.setStoreDescription(dto.getStoreDescription());
        store.setStoreAddress(dto.getStoreAddress());
        store.setCreatedBy(dto.getCreateBy());
        return store;
    }

    @Override
    public List<StoreRequestDto> getAllStoreDto() {
        List<Store> stores = storeRepository.findAll();
        return stores.stream()
                .map(storeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<StoreResponseDto> getAllStoreResponseDto() {
        return storeRepository.findAll().stream()
                .map(store -> {
                    StoreResponseDto dto = new StoreResponseDto();
                    dto.setId(store.getId());
                    dto.setStoreName(store.getStoreName());
                    dto.setStoreDescription(store.getStoreDescription());
                    dto.setStoreAddress(store.getStoreAddress());
                    return dto;
                })
                .toList();
    }

}