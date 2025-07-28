package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.CustomerRequestDto;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import com.farmovo.backend.services.CustomerService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = CustomerController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class CustomerControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerService customerService;

    @MockBean
    private com.farmovo.backend.jwt.JwtUtils jwtUtils;
    @MockBean
    private com.farmovo.backend.jwt.AuthTokenFilter authTokenFilter;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCreateCustomer() throws Exception {
        CustomerRequestDto requestDto = new CustomerRequestDto(null, "John Doe", "john@example.com", "123456789", null, BigDecimal.ZERO, false);
        CustomerResponseDto responseDto = new CustomerResponseDto(1L, "John Doe", "john@example.com", "123456789", null, BigDecimal.ZERO, 1L, null, null, null, null, false);
        when(customerService.createCustomer(any(CustomerRequestDto.class), eq(1L))).thenReturn(responseDto);

        mockMvc.perform(post("/api/customer")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto))
                .param("createdBy", "1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.name").value("John Doe"));
    }

    @Test
    void testGetCustomerById() throws Exception {
        CustomerResponseDto responseDto = new CustomerResponseDto(1L, "John Doe", "john@example.com", "123456789", null, BigDecimal.ZERO, 1L, null, null, null, null, false);
        when(customerService.getCustomerById(1L)).thenReturn(responseDto);

        mockMvc.perform(get("/api/customer/admin/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void testGetAllCustomers() throws Exception {
        List<CustomerResponseDto> customers = Arrays.asList(
                new CustomerResponseDto(1L, "John Doe", "john@example.com", "123456789", null, BigDecimal.ZERO, 1L, null, null, null, null, false),
                new CustomerResponseDto(2L, "Jane Smith", "jane@example.com", "987654321", null, BigDecimal.ZERO, 1L, null, null, null, null, false)
        );
        when(customerService.getAllCustomers()).thenReturn(customers);

        mockMvc.perform(get("/api/customer/admin/customerList"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[1].id").value(2L));
    }

    @Test
    void testSearchCustomersByName() throws Exception {
        List<CustomerResponseDto> customers = Arrays.asList(
                new CustomerResponseDto(1L, "John Doe", "john@example.com", "123456789", null, BigDecimal.ZERO, 1L, null, null, null, null, false)
        );
        when(customerService.searchCustomersByName("John")).thenReturn(customers);

        mockMvc.perform(get("/api/customer/search").param("name", "John"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("John Doe"));
    }

    @Test
    void testGetCustomerDetailsById() throws Exception {
        CustomerResponseDto responseDto = new CustomerResponseDto(1L, "John Doe", "john@example.com", "123456789", null, BigDecimal.ZERO, 1L, null, null, null, null, false);
        when(customerService.getCustomerById(1L)).thenReturn(responseDto);

        mockMvc.perform(get("/api/customer/details/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void testUpdateCustomer() throws Exception {
        CustomerRequestDto requestDto = new CustomerRequestDto(null, "John Updated", "john@example.com", "123456789", null, BigDecimal.ZERO, false);
        CustomerResponseDto responseDto = new CustomerResponseDto(1L, "John Updated", "john@example.com", "123456789", null, BigDecimal.ZERO, 1L, null, null, null, null, false);
        when(customerService.updateCustomer(eq(1L), any(CustomerRequestDto.class))).thenReturn(responseDto);

        mockMvc.perform(put("/api/customer/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John Updated"));
    }

    @Test
    void testSoftDeleteCustomer() throws Exception {
        doNothing().when(customerService).softDeleteCustomer(1L, 2L);
        mockMvc.perform(delete("/api/customer/1").param("deletedBy", "2"))
                .andExpect(status().isNoContent());
    }

    @Test
    void testUploadEvidence() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", MediaType.TEXT_PLAIN_VALUE, "test content".getBytes());
        mockMvc.perform(multipart("/api/customer/admin/upload-evidence").file(file))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("test.txt")));
    }

    @Test
    void testGetSuppliers() throws Exception {
        List<CustomerResponseDto> suppliers = Arrays.asList(
                new CustomerResponseDto(1L, "Supplier A", "supA@example.com", "123456789", null, BigDecimal.ZERO, 1L, null, null, null, null, true),
                new CustomerResponseDto(2L, "Supplier B", "supB@example.com", "987654321", null, BigDecimal.ZERO, 1L, null, null, null, null, true)
        );
        when(customerService.getAllCustomers()).thenReturn(suppliers);
        mockMvc.perform(get("/api/customer/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].isSupplier").value(true));
    }
} 