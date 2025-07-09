package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sale-transactions")
@RequiredArgsConstructor
public class SaleTransactionController {

    private final ImportTransactionDetailRepository detailRepository;
    private final ProductMapper productMapper;
    private final SaleTransactionService saleTransactionService;
    private final CustomerService customerService;
    private final ProductService productService;
    private final ZoneService zoneService;


    @GetMapping("/create-form-data")
    public ResponseEntity<SaleTransactionCreateFormDataDto> getCreateFormData() {
        List<CustomerDto> customers = customerService.getAllCustomerDto();
        List<ProductSaleResponseDto> products = productService.getAllProductSaleDto();
        SaleTransactionCreateFormDataDto formData = new SaleTransactionCreateFormDataDto();
        formData.setCustomers(customers);
        formData.setProducts(products);
        return ResponseEntity.ok(formData);
    }

    @GetMapping("/product-response/{productId}")
    public List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(@PathVariable Long productId) {
        List<ImportTransactionDetail> details = detailRepository.findByProductId(productId);
        return details.stream()
                .map(productMapper::toDtoSale)
                .collect(Collectors.toList());
    }

    @PostMapping("/save")
    public ResponseEntity<String> save(@RequestBody CreateSaleTransactionRequestDto dto) {
        saleTransactionService.save(dto);
        return ResponseEntity.ok("Sale transaction saved successfully.");
    }

    @GetMapping("/list-all")
    public ResponseEntity<List<SaleTransactionResponseDto>> listAllSaleTransactions() {
        List<SaleTransactionResponseDto> transactions = saleTransactionService.getAll();
        return ResponseEntity.ok(transactions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateSaleTransaction(
            @PathVariable Long id,
            @RequestBody CreateSaleTransactionRequestDto dto) {
        saleTransactionService.updateSaleTransaction(id, dto);
        return ResponseEntity.ok("Sale transaction updated successfully");
    }


}

