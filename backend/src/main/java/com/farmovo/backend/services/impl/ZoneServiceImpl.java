package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.exceptions.ZoneNotFoundException;
import com.farmovo.backend.mapper.ZoneMapper;
import com.farmovo.backend.models.Zone;
import com.farmovo.backend.repositories.ZoneRepository;
import com.farmovo.backend.services.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ZoneServiceImpl implements ZoneService {
    @Autowired
    private ZoneRepository zoneRepository;

    @Autowired
    private ZoneMapper zoneMapper;

    @Override
    public List<ZoneResponseDto> getAllZones() {
        return zoneRepository.findAll()
                .stream()
                .map(zoneMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public ZoneResponseDto createZone(ZoneRequestDto request) {
        Zone zone = zoneMapper.toEntity(request);
        String zoneName = zone.getZoneName();
        if (zoneName != null && !zoneName.matches("Z_\\[\\d+;\\d+\\]")) {
            throw new IllegalArgumentException("Zone name must follow pattern Z_[row;column] (e.g :Z_[1;2])");
        }
        zone.setCreatedAt(LocalDateTime.now());
        return zoneMapper.toResponseDto(zoneRepository.save(zone));
    }

    @Override
    public ZoneResponseDto updateZone(Long id, ZoneRequestDto request) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found with id: " + id));
        String zoneName = request.getZoneName();
        if (zoneName != null && !zoneName.matches("Z_\\[\\d+;\\d+\\]")) {
            throw new IllegalArgumentException("Zone name must follow pattern Z_[row;column] (e.g : Z_[1;2])");
        }
        zone.setZoneName(request.getZoneName());
        zone.setZoneDescription(request.getZoneDescription());
        zone.setUpdatedAt(LocalDateTime.now());
        return zoneMapper.toResponseDto(zoneRepository.save(zone));
    }

    @Override
    public void deleteZone(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found with id: " + id));
        zoneRepository.delete(zone);
    }
}
