package com.farmovo.backend.mapper;

import com.farmovo.backend.models.Stocktake;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface StocktakeMapper {
    StocktakeMapper INSTANCE = Mappers.getMapper(StocktakeMapper.class);

    @Mapping(source = "store.id", target = "storeId")
    StocktakeResponseDto toResponseDto(Stocktake stocktake);
} 