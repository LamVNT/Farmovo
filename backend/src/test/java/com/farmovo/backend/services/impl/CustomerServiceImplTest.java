package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.dto.request.CustomerRequestDto;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import com.farmovo.backend.mapper.CustomerMapper;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.repositories.CustomerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class CustomerServiceImplTest {
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private CustomerMapper customerMapper;
    @InjectMocks
    private CustomerServiceImpl customerService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllCustomerDto() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setName("John Doe");
        CustomerDto customerDto = new CustomerDto(1L, "John Doe", null,null,null,null,null,null,null);
        when(customerRepository.findAll()).thenReturn(Collections.singletonList(customer));
        when(customerMapper.toDto(customer)).thenReturn(customerDto);
        List<CustomerDto> result = customerService.getAllCustomerDto();
        assertEquals(1, result.size());
        assertEquals("John Doe", result.get(0).getName());
    }

    @Test
    void testCreateCustomer() {
        CustomerRequestDto requestDto = new CustomerRequestDto(null, "John Doe", "john@example.com", "123456789", null, BigDecimal.ZERO, false);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setName("John Doe");
        customer.setEmail("john@example.com");
        customer.setPhone("123456789");
        customer.setIsSupplier(false);
        customer.setTotalDebt(BigDecimal.ZERO);
        customer.setCreatedBy(1L);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        CustomerResponseDto result = customerService.createCustomer(requestDto, 1L);
        assertEquals("John Doe", result.getName());
        assertEquals("john@example.com", result.getEmail());
        assertEquals(BigDecimal.ZERO, result.getTotalDebt());
    }

    @Test
    void testGetCustomerById() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setName("John Doe");
        when(customerRepository.findByIdAndActive(1L)).thenReturn(customer);
        CustomerResponseDto result = customerService.getCustomerById(1L);
        assertEquals(1L, result.getId());
        assertEquals("John Doe", result.getName());
    }

    @Test
    void testGetAllCustomers() {
        Customer customer1 = new Customer();
        customer1.setId(1L);
        customer1.setName("John Doe");
        Customer customer2 = new Customer();
        customer2.setId(2L);
        customer2.setName("Jane Smith");
        when(customerRepository.findAllActive()).thenReturn(Arrays.asList(customer1, customer2));
        List<CustomerResponseDto> result = customerService.getAllCustomers();
        assertEquals(2, result.size());
    }

    @Test
    void testSearchCustomersByName() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setName("John Doe");
        when(customerRepository.findByNameContainingIgnoreCaseAndActive("John")).thenReturn(Arrays.asList(customer));
        List<CustomerResponseDto> result = customerService.searchCustomersByName("John");
        assertEquals(1, result.size());
        assertEquals("John Doe", result.get(0).getName());
    }

    @Test
    void testUpdateCustomer() {
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setName("John Doe");
        customer.setEmail("john@example.com");
        customer.setPhone("123456789");
        customer.setTotalDebt(BigDecimal.ZERO);
        when(customerRepository.findByIdAndActive(1L)).thenReturn(customer);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        CustomerRequestDto requestDto = new CustomerRequestDto(null, "John Updated", "john@example.com", "123456789", null, BigDecimal.ZERO, false);
        CustomerResponseDto result = customerService.updateCustomer(1L, requestDto);
        assertEquals("John Updated", result.getName());
    }

    @Test
    void testSoftDeleteCustomer() {
        Customer customer = new Customer();
        customer.setId(1L);
        when(customerRepository.findByIdAndActive(1L)).thenReturn(customer);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        customerService.softDeleteCustomer(1L, 2L);
        assertNotNull(customer.getDeletedAt());
        assertEquals(2L, customer.getDeletedBy());
    }

    @Test
    void testGetCustomerById_NotFound() {
        when(customerRepository.findByIdAndActive(1L)).thenReturn(null);
        Exception exception = assertThrows(IllegalArgumentException.class, () -> customerService.getCustomerById(1L));
        assertTrue(exception.getMessage().contains("Customer not found"));
    }

    @Test
    void testUpdateCustomer_NotFound() {
        when(customerRepository.findByIdAndActive(1L)).thenReturn(null);
        CustomerRequestDto requestDto = new CustomerRequestDto(null, "John Updated", "john@example.com", "123456789", null, BigDecimal.ZERO, false);
        Exception exception = assertThrows(IllegalArgumentException.class, () -> customerService.updateCustomer(1L, requestDto));
        assertTrue(exception.getMessage().contains("Customer not found"));
    }

    @Test
    void testSoftDeleteCustomer_NotFound() {
        when(customerRepository.findByIdAndActive(1L)).thenReturn(null);
        Exception exception = assertThrows(IllegalArgumentException.class, () -> customerService.softDeleteCustomer(1L, 2L));
        assertTrue(exception.getMessage().contains("Customer not found"));
    }

    @Test
    void testCreateCustomer_InvalidName() {
        CustomerRequestDto requestDto = new CustomerRequestDto(null, "", "john@example.com", "123456789", null, BigDecimal.ZERO, false);
        Exception exception = assertThrows(IllegalArgumentException.class, () -> customerService.createCustomer(requestDto, 1L));
        assertTrue(exception.getMessage().contains("Customer name is required"));
    }

    @Test
    void testCreateCustomer_NegativeDebt() {
        CustomerRequestDto requestDto = new CustomerRequestDto(null, "John Doe", "john@example.com", "123456789", null, new BigDecimal("-10"), false);
        Exception exception = assertThrows(IllegalArgumentException.class, () -> customerService.createCustomer(requestDto, 1L));
        assertTrue(exception.getMessage().contains("Total debt cannot be negative"));
    }
} 