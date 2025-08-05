package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.dto.request.CustomerRequestDto;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface CustomerService {

    List<CustomerDto> getAllCustomerDto();

    CustomerResponseDto createCustomer(CustomerRequestDto requestDto, Long createdBy);

    CustomerResponseDto getCustomerById(Long id);

    List<CustomerResponseDto> getAllCustomers();

    Page<CustomerResponseDto> getCustomerPage(Pageable pageable, String search);

    Page<CustomerResponseDto> searchCustomers(String name, String phone, String email,
                                              Boolean isSupplier, Boolean debtOnly,
                                              LocalDateTime fromDate, LocalDateTime toDate,
                                              Pageable pageable);

    List<CustomerResponseDto> searchCustomersByName(String name);

    CustomerResponseDto updateCustomer(Long id, CustomerRequestDto requestDto);

    void softDeleteCustomer(Long id, Long deletedBy);
}