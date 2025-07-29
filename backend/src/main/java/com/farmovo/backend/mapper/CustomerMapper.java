package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.dto.request.CustomerRequestDto;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import com.farmovo.backend.models.Customer;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    CustomerMapper INSTANCE = Mappers.getMapper(CustomerMapper.class);
    @Mapping(target = "address", source = "address")
    @Mapping(target = "phone", source = "phone")
    @Mapping(target = "email", source = "email")
    @Mapping(target = "totalDebt", source = "totalDebt")
    @Mapping(target = "createBy", source = "createdBy")
    @Mapping(target = "createAt", source = "createdAt")

    // Mapping entity -> lightweight dto for dropdowns etc.
    CustomerDto toDto(Customer customer);

    // Mapping request dto -> entity for create/update operations
    @Mapping(target = "totalDebt", source = "totalDept")
    @Mapping(target = "isSupplier", expression = "java(requestDto.getRole() != null && requestDto.getRole().equalsIgnoreCase(\"SUPPLIER\"))")
    @Mapping(target = "address", ignore = true) // not present in request dto
    @Mapping(target = "debtNotes", ignore = true)
    @Mapping(target = "importTransactions", ignore = true)
    @Mapping(target = "saleTransactions", ignore = true)
    Customer toEntity(CustomerRequestDto requestDto);

    // Mapping entity -> full response dto
    @Mapping(target = "createBy", source = "createdBy")
    @Mapping(target = "createAt", source = "createdAt")
    @Mapping(target = "updateAt", source = "updatedAt")
    @Mapping(target = "deleteAt", source = "deletedAt")
    @Mapping(target = "deleteBy", source = "deletedBy")
    CustomerResponseDto toResponseDto(Customer customer);

    List<CustomerResponseDto> toResponseDtoList(List<Customer> customers);
}

