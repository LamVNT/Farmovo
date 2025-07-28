package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.models.Customer;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    @org.mapstruct.Mapping(target = "address", source = "address")
    @org.mapstruct.Mapping(target = "phone", source = "phone")
    @org.mapstruct.Mapping(target = "email", source = "email")
    @org.mapstruct.Mapping(target = "totalDebt", source = "totalDebt")
    @org.mapstruct.Mapping(target = "createBy", source = "createdBy")
    @org.mapstruct.Mapping(target = "createAt", source = "createdAt")
    CustomerDto toDto(Customer customer);
}

