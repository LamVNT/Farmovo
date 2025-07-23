package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.ZoneDto;
import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.models.Zone;

import java.util.List;

public interface ZoneService {
    List<ZoneDto> getAllZoneDtos();

    List<ZoneResponseDto> getAllZones();

    ZoneResponseDto createZone(ZoneRequestDto request);

    ZoneResponseDto updateZone(Long id, ZoneRequestDto request);

    void deleteZone(Long id);

    List<Zone> getAllZoneEntities();
}


