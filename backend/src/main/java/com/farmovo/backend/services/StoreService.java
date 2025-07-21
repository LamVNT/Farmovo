package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.models.Store;

import java.util.List;
import java.util.Optional;

public interface StoreService {
    List<Store> getAllStores();

    Optional<Store> getStoreById(Long id);

    Store saveStore(Store store);

    Optional<Store> updateStore(Long id, Store store);

    boolean deleteStore(Long id);

    Store convertToEntity(StoreRequestDto dto);
    List<StoreRequestDto> getAllStoreDto();
}