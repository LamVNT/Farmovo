package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.models.Store;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface StoreMapper {

    @Mapping(source = "id", target = "id")
    @Mapping(source = "storeName", target = "storeName")
    @Mapping(source = "storeDescription", target = "storeDescription")
    @Mapping(source = "storeAddress", target = "storeAddress")
    @Mapping(source = "createdBy", target = "createBy")
    @Mapping(source = "createdAt", target = "createAt")
    @Mapping(source = "updatedAt", target = "updateAt")
    @Mapping(source = "deletedAt", target = "deleteAt")
    @Mapping(source = "deletedBy", target = "deleteBy")
    StoreRequestDto toDto(Store store);

    @Mapping(source = "id", target = "id")
    @Mapping(source = "storeName", target = "storeName")
    @Mapping(source = "storeDescription", target = "storeDescription")
    @Mapping(source = "storeAddress", target = "storeAddress")
    StoreResponseDto toResponseDto(Store store);

    List<StoreRequestDto> toDtoList(List<Store> stores);
}
