package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.DebtNote;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import java.util.List;

@Mapper(componentModel = "spring")
public interface DebtNoteMapper {

    // Map Entity -> ResponseDto
    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "store.id", target = "storeId")
    DebtNoteResponseDto toResponseDto(DebtNote entity);

    List<DebtNoteResponseDto> toResponseDtoList(List<DebtNote> entities);

    // Map RequestDto -> Entity (id, createdAt, etc. will be set in service)
    @Mapping(source = "customerId", target = "customer.id")
    @Mapping(source = "storeId", target = "store.id")
    @Mapping(target = "id", ignore = true)
    DebtNote toEntity(DebtNoteRequestDto dto);
} 