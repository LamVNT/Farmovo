package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.dto.request.CustomerRequestDto;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import com.farmovo.backend.models.Customer;

import java.util.List;

public interface CustomerService {

    List<CustomerDto> getAllCustomerDto();

    CustomerResponseDto createCustomer(CustomerRequestDto requestDto, Long createdBy);

    CustomerResponseDto getCustomerById(Long id);

    List<CustomerResponseDto> getAllCustomers();

    List<CustomerResponseDto> searchCustomersByName(String name);

    CustomerResponseDto updateCustomer(Long id, CustomerRequestDto requestDto);

    void softDeleteCustomer(Long id, Long deletedBy);
}