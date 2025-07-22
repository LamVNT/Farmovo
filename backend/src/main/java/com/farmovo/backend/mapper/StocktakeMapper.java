package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.models.Stocktake;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StocktakeMapper {
    StocktakeMapper INSTANCE = Mappers.getMapper(StocktakeMapper.class);

    // Bỏ mapping trường detail, để service tự set
    @Mapping(target = "detail", ignore = true)
    @Mapping(target = "rawDetail", ignore = true)
    StocktakeResponseDto toResponseDto(Stocktake stocktake);
} 