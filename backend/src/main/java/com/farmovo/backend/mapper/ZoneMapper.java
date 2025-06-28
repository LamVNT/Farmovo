package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.models.Zone;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface ZoneMapper {
    ZoneMapper INSTANCE = Mappers.getMapper(ZoneMapper.class);

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "stocktakes", ignore = true)
    @Mapping(target = "importTransactionDetails", ignore = true)
    Zone toEntity(ZoneRequestDto requestDto);

    @Mapping(target = "zoneName", source = "zoneName")
    @Mapping(target = "zoneDescription", source = "zoneDescription")
    ZoneResponseDto toResponseDto(Zone zone);
}
