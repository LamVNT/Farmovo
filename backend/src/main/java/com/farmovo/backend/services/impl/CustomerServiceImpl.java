package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.dto.request.CustomerRequestDto;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import com.farmovo.backend.mapper.CustomerMapper;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.services.CustomerService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerServiceImpl implements CustomerService {

    private static final Logger logger = LogManager.getLogger(CustomerServiceImpl.class);

    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private CustomerMapper customerMapper;

    @Override
    public List<CustomerDto> getAllCustomerDto() {
        return customerRepository.findAll()
                .stream()
                .map(customerMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerResponseDto createCustomer(CustomerRequestDto requestDto, Long createdBy) {
        logger.info("Processing creation of customer: {}", requestDto.getName());
        validateRequest(requestDto);

        Customer customer = customerMapper.toEntity(requestDto);
        customer.setCreatedBy(createdBy);

        Customer savedCustomer = customerRepository.save(customer);
        return customerMapper.toResponseDto(savedCustomer);
    }

    @Override
    public CustomerResponseDto getCustomerById(Long id) {
        logger.info("Fetching customer with ID: {}", id);
        Customer customer = customerRepository.findByIdAndActive(id);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found or has been deleted: " + id);
        }
        return mapToResponseDto(customer);
    }

    @Override
    public List<CustomerResponseDto> getAllCustomers() {
        logger.info("Fetching all active customers");
        return customerRepository.findAllActive().stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<CustomerResponseDto> getCustomerPage(Pageable pageable, String search) {
        logger.info("Fetching customers with pagination, page: {}, size: {}, search: {}",
                   pageable.getPageNumber(), pageable.getPageSize(), search);

        Page<Customer> page;
        if (search != null && !search.trim().isEmpty()) {
            page = customerRepository.findByNameContainingIgnoreCaseAndActive(search.trim(), pageable);
        } else {
            page = customerRepository.findAllActive(pageable);
        }

        return page.map(this::mapToResponseDto);
    }

    @Override
    public Page<CustomerResponseDto> searchCustomers(String name, String phone, String email, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        Specification<Customer> spec = Specification.where(com.farmovo.backend.specification.CustomerSpecification.isNotDeleted())
                .and(com.farmovo.backend.specification.CustomerSpecification.hasName(name))
                .and(com.farmovo.backend.specification.CustomerSpecification.hasPhone(phone))
                .and(com.farmovo.backend.specification.CustomerSpecification.hasEmail(email))
                .and(com.farmovo.backend.specification.CustomerSpecification.createdBetween(fromDate, toDate));

        Page<Customer> pageResult = customerRepository.findAll(spec, pageable);
        return pageResult.map(this::mapToResponseDto);
    }

    @Override
    public List<CustomerResponseDto> searchCustomersByName(String name) {
        logger.info("Searching customers by name: {}", name);
        return customerRepository.findByNameContainingIgnoreCaseAndActive(name).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public CustomerResponseDto updateCustomer(Long id, CustomerRequestDto requestDto) {
        logger.info("Processing update for customer with ID: {}", id);
        Customer customer = customerRepository.findByIdAndActive(id);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found or has been deleted: " + id);
        }

        validateRequest(requestDto);

        customer.setName(requestDto.getName());
        customer.setEmail(requestDto.getEmail());
        customer.setPhone(requestDto.getPhone());
        customer.setTotalDebt(requestDto.getTotalDebt());
        if (requestDto.getIsSupplier() != null) {
            customer.setIsSupplier(requestDto.getIsSupplier());
        }

        Customer updatedCustomer = customerRepository.save(customer);
        return customerMapper.toResponseDto(updatedCustomer);
    }

    @Override
    public void softDeleteCustomer(Long id, Long deletedBy) {
        logger.info("Processing soft delete for customer with ID: {}", id);
        Customer customer = customerRepository.findByIdAndActive(id);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found or has been deleted: " + id);
        }
        customer.setDeletedAt(LocalDateTime.now());
        customer.setDeletedBy(deletedBy);
        customerRepository.save(customer);
    }

    private void validateRequest(CustomerRequestDto requestDto) {
        if (requestDto.getName() == null || requestDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (requestDto.getTotalDebt() != null && requestDto.getTotalDebt().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Total debt cannot be negative");
        }
    }

    private CustomerResponseDto mapToResponseDto(Customer customer) {
        logger.debug("Mapping customer to response DTO: {}", customer.getName());
        return customerMapper.toResponseDto(customer);
    }
}