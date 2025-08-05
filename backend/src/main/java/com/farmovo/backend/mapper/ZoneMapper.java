package com.farmovo.backend.mapper;


import com.farmovo.backend.dto.request.ZoneRequestDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.dto.request.ZoneDto;
import com.farmovo.backend.models.Zone;
import com.farmovo.backend.models.Store;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ZoneMapper {
    ZoneMapper INSTANCE = Mappers.getMapper(ZoneMapper.class);

    ZoneDto toDto(Zone zone);

    @Mapping(target = "zoneName", source = "zoneName")
    @Mapping(target = "zoneDescription", source = "zoneDescription")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "store", expression = "java(mapStore(requestDto.getStoreId()))")
    Zone toEntity(ZoneRequestDto requestDto);


    List<ZoneDto> toDtoList(List<Zone> zones);

    @Mapping(target = "zoneName", source = "zoneName")
    @Mapping(target = "zoneDescription", source = "zoneDescription")
    @Mapping(target = "createAt", source = "createdAt")
    @Mapping(target = "updateAt", source = "updatedAt")
    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.storeName")
    ZoneResponseDto toResponseDto(Zone zone);

    @Named("mapStore")
    default Store mapStore(Long storeId) {
        return storeId != null ? new Store(storeId) : null;
    }
}
