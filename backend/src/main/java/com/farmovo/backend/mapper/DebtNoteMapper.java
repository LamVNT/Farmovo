package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.DebtNote;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.Store;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring")
public interface DebtNoteMapper {

    @Mapping(source = "customer.id", target = "customerId")
    @Mapping(source = "store.id", target = "storeId")
    @Mapping(source = "debtAmount", target = "debtAmount")
    @Mapping(source = "debtDate", target = "debtDate")
    @Mapping(source = "debtType", target = "debtType")
    @Mapping(source = "debtDescription", target = "debtDescription")
    @Mapping(source = "debtEvidences", target = "debtEvidences")
    @Mapping(source = "fromSource", target = "fromSource")
    @Mapping(source = "sourceId", target = "sourceId")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "createdBy", target = "createdBy")
    @Mapping(source = "updatedAt", target = "updatedAt")
    @Mapping(source = "deletedAt", target = "deletedAt")
    @Mapping(source = "deletedBy", target = "deletedBy")
    DebtNoteResponseDto toResponseDto(DebtNote debtNote);

    List<DebtNoteResponseDto> toResponseDtoList(List<DebtNote> debtNotes);

    @Mapping(target = "id", ignore = true)
    @Mapping(source = "customer", target = "customer")
    @Mapping(source = "store", target = "store")
    @Mapping(source = "requestDto.debtAmount", target = "debtAmount", qualifiedByName = "absAmount")
    @Mapping(source = "requestDto.debtDate", target = "debtDate")
    @Mapping(source = "requestDto.debtType", target = "debtType")
    @Mapping(source = "requestDto.debtDescription", target = "debtDescription")
    @Mapping(source = "requestDto.debtEvidences", target = "debtEvidences")
    @Mapping(source = "requestDto.fromSource", target = "fromSource")
    @Mapping(source = "requestDto.sourceId", target = "sourceId")
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "createdBy", constant = "1L")
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    DebtNote toEntity(DebtNoteRequestDto requestDto, Customer customer, Store store);

    @Mapping(target = "id", ignore = true)
    @Mapping(source = "customer", target = "customer")
    @Mapping(source = "store", target = "store")
    @Mapping(source = "requestDto.debtAmount", target = "debtAmount", qualifiedByName = "absAmount")
    @Mapping(source = "requestDto.debtDate", target = "debtDate")
    @Mapping(source = "requestDto.debtType", target = "debtType")
    @Mapping(source = "requestDto.debtDescription", target = "debtDescription")
    @Mapping(source = "requestDto.debtEvidences", target = "debtEvidences")
    @Mapping(source = "requestDto.fromSource", target = "fromSource")
    @Mapping(source = "requestDto.sourceId", target = "sourceId")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    DebtNote updateEntityFromRequest(DebtNote debtNote, DebtNoteRequestDto requestDto, Customer customer, Store store);

    @Named("absAmount")
    default BigDecimal absAmount(BigDecimal amount) {
        return amount != null ? amount.abs() : BigDecimal.ZERO;
    }
} 