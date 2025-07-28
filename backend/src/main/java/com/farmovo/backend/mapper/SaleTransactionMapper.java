package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.models.SaleTransaction;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring")
public interface SaleTransactionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "store", ignore = true)
    @Mapping(target = "detail", expression = "java(toJson(requestDto.getDetail(), objectMapper))")
    SaleTransaction toEntity(CreateSaleTransactionRequestDto requestDto, @Context ObjectMapper objectMapper);

    // Hàm hỗ trợ để convert List<ProductSaleResponseDto> thành JSON
    default String toJson(List<ProductSaleResponseDto> detailList, @Context ObjectMapper objectMapper) {
        try {
            return objectMapper.writeValueAsString(detailList);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new RuntimeException("Failed to convert detail list to JSON", e);
        }
    }


    // ✅ Map chiều ngược lại: Entity → ResponseDto (để dùng khi list)
    @Mapping(target = "customerName", source = "customer.name")
    @Mapping(target = "customerPhone", source = "customer.phone")
    @Mapping(target = "customerAddress", source = "customer.address")
    @Mapping(target = "storeName", source = "store.storeName")
    @Mapping(target = "storeAddress", source = "store.storeAddress")
    @Mapping(target = "createdBy", source = "createdBy")
    @Mapping(target = "name", source = "name")
    @Mapping(target = "detail", expression = "java(fromJson(entity.getDetail(), objectMapper))")
    SaleTransactionResponseDto toResponseDto(SaleTransaction entity, @Context ObjectMapper objectMapper);

    // List version
    List<SaleTransactionResponseDto> toResponseDtoList(List<SaleTransaction> entities, @Context ObjectMapper objectMapper);

    // Parse từ JSON sang List<ProductSaleResponseDto>
    default List<ProductSaleResponseDto> fromJson(String json, @Context ObjectMapper objectMapper) {
        try {
            return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<ProductSaleResponseDto>>() {
            });
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return Collections.emptyList(); // hoặc throw nếu muốn bắt buộc phải đúng định dạng
        }
    }
}

