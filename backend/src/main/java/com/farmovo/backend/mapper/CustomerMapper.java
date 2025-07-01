package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.models.Customer;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CustomerMapper {
    CustomerDto toDto(Customer customer);
}

