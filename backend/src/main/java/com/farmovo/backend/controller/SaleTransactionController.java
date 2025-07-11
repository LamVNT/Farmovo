package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.exceptions.ResourceNotFoundException;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
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
    private final ImportTransactionDetailService importTransactionDetailService;
    private final ProductRepository productRepository;
    private final JwtUtils jwtUtils;


    @GetMapping("/create-form-data")
    public ResponseEntity<ImportTransactionCreateFormDataDto> getCreateFormData() {
        List<CustomerDto> customers = customerService.getAllCustomerDto();
        List<ProductDto> products = productService.getAllProductDto();
        ImportTransactionCreateFormDataDto formData = new ImportTransactionCreateFormDataDto();
        formData.setCustomers(customers);
        formData.setProducts(products);

        return ResponseEntity.ok(formData);
    }

    @GetMapping("/product-response/{productId}")
    public ResponseEntity<List<ProductSaleResponseDto>> listAllProductResponseDtoByIdPro(@PathVariable Long productId) {
        // Kiểm tra sản phẩm có tồn tại không
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product không tồn tại với ID: " + productId));

        List<ImportTransactionDetail> details = detailRepository.findCompletedDetailsWithQuantityByProductId(productId);
        if (details.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy lô hàng còn tồn cho sản phẩm ID: " + productId);
        }
        List<ProductSaleResponseDto> result = details.stream()
                .map(productMapper::toDtoSale)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }


    @PostMapping("/save")
    public ResponseEntity<String> save(@RequestBody CreateSaleTransactionRequestDto dto, HttpServletRequest request) {

        String token = jwtUtils.getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            saleTransactionService.save(dto,userId);
        }
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

