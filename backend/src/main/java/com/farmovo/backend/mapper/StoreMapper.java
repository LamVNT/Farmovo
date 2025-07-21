package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.models.Store;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface StoreMapper {
    List<StoreRequestDto> toDtoList(List<Store> stores);
}
