package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.models.Stocktake;
import org.mapstruct.Mapper;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface StocktakeMapper {
    StocktakeMapper INSTANCE = Mappers.getMapper(StocktakeMapper.class);

    // Chỉ map các trường cơ bản, detail sẽ xử lý enrich ở Service
    StocktakeResponseDto toResponseDto(Stocktake stocktake);
} 