package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.ImportTransactionDetail;
import org.mapstruct.*;
import java.util.List;

@Mapper(componentModel = "spring")
public interface ImportTransactionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(source = "supplierId", target = "supplier.id")
    @Mapping(source = "storeId", target = "store.id")
    @Mapping(source = "staffId", target = "staff.id")
    @Mapping(target = "details", source = "details")
    ImportTransaction toEntity(CreateImportTransactionRequestDto dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "importTransaction", ignore = true) // tránh vòng lặp
    @Mapping(source = "productId", target = "product.id")
    @Mapping(source = "zones_id", target = "zones_id")
    ImportTransactionDetail toDetailEntity(CreateImportTransactionRequestDto.DetailDto dto);

    List<ImportTransactionDetail> toDetailEntityList(List<CreateImportTransactionRequestDto.DetailDto> details);


    // Map từ Entity sang DTO
    @Mapping(source = "id", target = "id")
    @Mapping(source = "supplier.id", target = "supplierId")
    @Mapping(source = "store.id", target = "storeId")
    @Mapping(source = "staff.id", target = "staffId")
    @Mapping(source = "details", target = "details")
    @Mapping(source = "importDate", target = "importDate")
    CreateImportTransactionRequestDto toDto(ImportTransaction entity);


    @Mapping(source = "id", target = "id")
    @Mapping(source = "supplier.id", target = "supplierId")
    @Mapping(source = "supplier.name", target = "supplierName")
    @Mapping(source = "store.id", target = "storeId")
    @Mapping(source = "staff.id", target = "staffId")
    @Mapping(source = "totalAmount", target = "totalAmount")
    @Mapping(source = "paidAmount", target = "paidAmount")
    @Mapping(source = "importDate", target = "importDate")
    ImportTransactionResponseDto toResponseDto(ImportTransaction entity);


    @Mapping(source = "product.productName", target = "productName")
    @Mapping(source = "product.id", target = "productId")
    CreateImportTransactionRequestDto.DetailDto toDetailDto(ImportTransactionDetail detail);

    List<CreateImportTransactionRequestDto.DetailDto> toDetailDtoList(List<ImportTransactionDetail> details);
}

