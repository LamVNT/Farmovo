package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.request.ProductRequestDto;
import com.farmovo.backend.jwt.AuthTokenFilter;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.services.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = ProductController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class ProductControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProductService productService;

    @MockBean
    private AuthTokenFilter authTokenFilter;
    @MockBean
    private JwtUtils jwtUtils;

    @Autowired
    private ObjectMapper objectMapper;

    private ProductDto productDto;
    private ProductRequestDto productRequestDto;

    @BeforeEach
    void setUp() {
        productDto = new ProductDto();
        // set fields for productDto if needed
        productRequestDto = new ProductRequestDto();
        // set fields for productRequestDto if needed
    }

    @Test
    @DisplayName("GET /api/products - success")
    void testGetAllProducts() throws Exception {
        List<ProductDto> products = Arrays.asList(productDto);
        given(productService.getAllProductDto()).willReturn(products);

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("GET /api/products/{id} - success")
    void testGetProductById() throws Exception {
        given(productService.getProductNameById(1L)).willReturn(productDto);

        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("POST /api/products - success")
    void testCreateProduct() throws Exception {
        given(productService.createProduct(any(ProductRequestDto.class))).willReturn(productDto);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productRequestDto)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("PUT /api/products/{id} - success")
    void testUpdateProduct() throws Exception {
        given(productService.updateProduct(eq(1L), any(ProductRequestDto.class))).willReturn(productDto);

        mockMvc.perform(put("/api/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productRequestDto)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("DELETE /api/products/{id} - success")
    void testDeleteProduct() throws Exception {
        doNothing().when(productService).deleteProduct(1L);

        mockMvc.perform(delete("/api/products/1"))
                .andExpect(status().isNoContent());
    }
}
