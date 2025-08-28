package com.farmovo.backend.services.impl;
import com.farmovo.backend.dto.request.ZoneDto;
import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.exceptions.ZoneNotFoundException;
import com.farmovo.backend.exceptions.StoreNotFoundException;
import com.farmovo.backend.mapper.ZoneMapper;
import com.farmovo.backend.models.Zone;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.ZoneRepository;
import com.farmovo.backend.services.ZoneService;
import com.farmovo.backend.services.StoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static com.farmovo.backend.validator.ZoneValidation.validateZoneDescription;
import static com.farmovo.backend.validator.ZoneValidation.validateZoneName;

@Service
public class ZoneServiceImpl implements ZoneService {

    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private ZoneMapper zoneMapper;

    @Autowired
    private StoreService storeService;

    @Override
    public List<ZoneDto> getAllZoneDtos() {
        return zoneMapper.toDtoList(zoneRepository.findAll());
    }

    @Override
    public List<ZoneResponseDto> getAllZones() {
        return zoneRepository.findAll()
                .stream()
                .map(zoneMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<Zone> getAllZoneEntities() {
        return zoneRepository.findAll();
    }

    @Override
    public ZoneResponseDto createZone(ZoneRequestDto request) {
        Zone zone = zoneMapper.toEntity(request);
        validateZoneName(zone.getZoneName());
        validateZoneDescription(zone.getZoneDescription());
        zone.setCreatedAt(LocalDateTime.now());
        
        // Fetch Store đầy đủ để có storeName ngay lập tức
        if (request.getStoreId() != null) {
            Store store = storeService.getStoreById(request.getStoreId())
                .orElseThrow(() -> new StoreNotFoundException("Store not found with id: " + request.getStoreId()));
            zone.setStore(store);
        }
        
        Zone savedZone = zoneRepository.save(zone);
        return zoneMapper.toResponseDto(savedZone);
    }

    @Override
    public ZoneResponseDto updateZone(Long id, ZoneRequestDto request) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found with id: " + id));
        
        // Validate zone name và description
        validateZoneName(request.getZoneName());
        validateZoneDescription(request.getZoneDescription());
        
        // Cập nhật thông tin zone
        zone.setZoneName(request.getZoneName());
        zone.setZoneDescription(request.getZoneDescription());
        zone.setUpdatedAt(LocalDateTime.now());
        
        // Fetch Store đầy đủ nếu storeId thay đổi hoặc chưa có
        if (request.getStoreId() != null && (zone.getStore() == null || !request.getStoreId().equals(zone.getStore().getId()))) {
            Store store = storeService.getStoreById(request.getStoreId())
                .orElseThrow(() -> new StoreNotFoundException("Store not found with id: " + request.getStoreId()));
            zone.setStore(store);
        }
        
        // Lưu lại và trả về kết quả
        return zoneMapper.toResponseDto(zoneRepository.save(zone));
    }

    @Override
    public void deleteZone(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found with id: " + id));
        zoneRepository.delete(zone);
    }

    @Override
    public List<ZoneResponseDto> getZonesByStoreId(Long storeId) {
        return zoneRepository.findAllByStore_Id(storeId)
                .stream()
                .map(zoneMapper::toResponseDto)
                .collect(java.util.stream.Collectors.toList());
    }
}