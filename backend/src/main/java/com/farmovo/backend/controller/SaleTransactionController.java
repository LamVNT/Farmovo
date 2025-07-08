package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.SaleTransactionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
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
    private final SaleTransactionRepository saleTransactionRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final ObjectMapper objectMapper;
    private final SaleTransactionService saleTransactionService;

    @GetMapping("/product-response/{productId}")
    public List<ProductResponseDto> listAllProductResponseDtoByIdPro(@PathVariable Long productId) {
        List<ImportTransactionDetail> details = detailRepository.findByProductId(productId);
        return details.stream()
                .map(productMapper::toDto)
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
}

