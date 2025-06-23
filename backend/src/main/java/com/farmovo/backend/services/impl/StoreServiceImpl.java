package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.StoreService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StoreServiceImpl implements StoreService {
    private static final Logger logger = LogManager.getLogger(StoreServiceImpl.class);

    @Autowired
    private StoreRepository storeRepository;
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
        logger.info("Saving new store: {}", store.getName());
        try {
            if (store.getName() == null || store.getName().isBlank()) {
                throw new IllegalArgumentException("Store name is required");
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
                if (store.getName() == null || store.getName().isBlank()) {
                    throw new IllegalArgumentException("Store name is required");
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
        logger.info("Converting StoreRequestDto to Store entity: {}", dto.getName());
        Store store = new Store();
        store.setName(dto.getName());
        store.setDescription(dto.getDescription());
        store.setAddress(dto.getAddress());
        store.setBankAccount(dto.getBankAccount());
        store.setCreateBy(dto.getCreateBy());
        store.setDeleteBy(dto.getDeleteBy());
        return store;
    }
}