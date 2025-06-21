package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.CategoryRequestDto;
import com.farmovo.backend.dto.response.CategoryResponseDto;
import com.farmovo.backend.models.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper
public interface CategoryMapper {
    CategoryMapper INSTANCE = Mappers.getMapper(CategoryMapper.class);

    @Mapping(target = "createAt", ignore = true)
    @Mapping(target = "updateAt", ignore = true)
    @Mapping(target = "deleteAt", ignore = true)
    @Mapping(target = "deleteBy", ignore = true)
    @Mapping(target = "createBy", ignore = true)
    @Mapping(target = "products", ignore = true)
    Category toEntity(CategoryRequestDto requestDto);

    @Mapping(target = "createAt", source = "createAt")
    @Mapping(target = "updateAt", source = "updateAt")
    CategoryResponseDto toResponseDto(Category category);
}