package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.models.Customer;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    @org.mapstruct.Mapping(target = "address", source = "address")
    @org.mapstruct.Mapping(target = "phone", source = "phone")
    @org.mapstruct.Mapping(target = "email", source = "email")
    CustomerDto toDto(Customer customer);
}

