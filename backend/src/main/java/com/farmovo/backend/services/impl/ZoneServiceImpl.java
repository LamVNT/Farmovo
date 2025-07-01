package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.ZoneDto;
import com.farmovo.backend.mapper.ZoneMapper;
import com.farmovo.backend.repositories.ZoneRepository;
import com.farmovo.backend.services.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ZoneServiceImpl implements ZoneService {

    @Autowired
    private ZoneRepository zoneRepository;
    @Autowired
    private  ZoneMapper zoneMapper;

    @Override
    public List<ZoneDto> getAllZoneDtos() {
        return zoneMapper.toDtoList(zoneRepository.findAll());
    }
}

