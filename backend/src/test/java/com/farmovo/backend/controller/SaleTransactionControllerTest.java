package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.*;
import com.farmovo.backend.jwt.AuthTokenFilter;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.services.*;
import com.farmovo.backend.services.impl.JwtAuthenticationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = SaleTransactionController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class})
@AutoConfigureMockMvc(addFilters = false)
class SaleTransactionControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ImportTransactionDetailRepository detailRepository;

    @MockBean
    private ProductMapper productMapper;

    @MockBean
    private SaleTransactionService saleTransactionService;

    @MockBean
    private CustomerService customerService;

    @MockBean
    private ProductService productService;

    @MockBean
    private StoreService storeService;

    @MockBean
    private ProductRepository productRepository;

    @MockBean
    private AuthTokenFilter authTokenFilter;

    @MockBean
    private JwtUtils jwtUtils;

    @Test
    void testGetCreateFormData() throws Exception {
        Mockito.when(customerService.getAllCustomerDto()).thenReturn(List.of());
        Mockito.when(storeService.getAllStores()).thenReturn(List.of(new Store()));
        Mockito.when(detailRepository.findByRemainQuantityGreaterThan(0)).thenReturn(List.of());
        Mockito.when(productService.getAllProductSaleDto()).thenReturn(List.of());
        mockMvc.perform(get("/api/sale-transactions/create-form-data"))
                .andExpect(status().isOk());
    }


    @Test
    void testListAllProductResponseDtoByIdPro() throws Exception {
        Mockito.when(productRepository.findById(anyLong())).thenReturn(java.util.Optional.of(new com.farmovo.backend.models.Product()));
        Mockito.when(detailRepository.findCompletedDetailsWithQuantityByProductId(anyLong())).thenReturn(List.of(new com.farmovo.backend.models.ImportTransactionDetail()));
        Mockito.when(productMapper.toDtoSale(any())).thenReturn(new ProductSaleResponseDto());
        mockMvc.perform(get("/api/sale-transactions/product-response/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testSave() throws Exception {
        String token = "valid.token";
        Mockito.when(jwtUtils.getJwtFromCookies(any())).thenReturn(token);
        Mockito.when(jwtUtils.validateJwtToken(token)).thenReturn(true);
        Mockito.when(jwtUtils.getUserIdFromJwtToken(token)).thenReturn(1L);
        Mockito.doNothing().when(saleTransactionService).save(any(CreateSaleTransactionRequestDto.class), eq(1L));
        mockMvc.perform(post("/api/sale-transactions/save")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    void testListAllSaleTransactions() throws Exception {
        Mockito.when(saleTransactionService.getAll()).thenReturn(List.of(new SaleTransactionResponseDto()));
        mockMvc.perform(get("/api/sale-transactions/list-all"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetSaleTransactionById() throws Exception {
        Mockito.when(saleTransactionService.getById(1L)).thenReturn(new SaleTransactionResponseDto());
        mockMvc.perform(get("/api/sale-transactions/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testUpdateSaleTransaction() throws Exception {
        Mockito.doNothing().when(saleTransactionService).updateSaleTransaction(eq(1L), any(CreateSaleTransactionRequestDto.class));
        mockMvc.perform(put("/api/sale-transactions/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetNextImportTransactionCode() throws Exception {
        Mockito.when(saleTransactionService.getNextSaleTransactionCode()).thenReturn("PB000001");
        mockMvc.perform(get("/api/sale-transactions/next-code"))
                .andExpect(status().isOk())
                .andExpect(content().string("PB000001"));
    }

    @Test
    void testCancelSaleTransaction() throws Exception {
        Mockito.doNothing().when(saleTransactionService).cancel(1L);
        mockMvc.perform(put("/api/sale-transactions/1/cancel"))
                .andExpect(status().isOk());
    }

    @Test
    void testCompleteSaleTransaction() throws Exception {
        Mockito.doNothing().when(saleTransactionService).complete(1L);
        mockMvc.perform(put("/api/sale-transactions/1/complete"))
                .andExpect(status().isOk());
    }

    @Test
    void testSoftDeleteSaleTransaction() throws Exception {
        String token = "valid.token";
        Mockito.when(jwtUtils.getJwtFromCookies(any())).thenReturn(token);
        Mockito.when(jwtUtils.validateJwtToken(token)).thenReturn(true);
        Mockito.when(jwtUtils.getUserIdFromJwtToken(token)).thenReturn(1L);
        Mockito.doNothing().when(saleTransactionService).softDeleteSaleTransaction(1L, 1L);
        mockMvc.perform(delete("/api/sale-transactions/sort-delete/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testExportSaleTransactionPdf() throws Exception {
        Mockito.when(saleTransactionService.exportPdf(1L)).thenReturn(new byte[]{1,2,3});
        mockMvc.perform(get("/api/sale-transactions/1/export-pdf"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"));
    }
}
