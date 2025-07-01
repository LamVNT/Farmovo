package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.ZoneDto;
import com.farmovo.backend.models.Zone;
import org.mapstruct.Mapper;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ZoneMapper {

    ZoneDto toDto(Zone zone);

    List<ZoneDto> toDtoList(List<Zone> zones);
}

