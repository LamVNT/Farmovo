package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.exceptions.ResourceNotFoundException;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
    private final ProductRepository productRepository;
    private final JwtUtils jwtUtils;
    private final StoreService storeService;


    @GetMapping("/create-form-data")
    public ResponseEntity<SaleTransactionCreateFormDataDto> getCreateFormData() {
        List<CustomerDto> customers = customerService.getAllCustomerDto();
        List<StoreResponseDto> stores = storeService.getAllStores().stream()
                .map(store -> {
                    StoreResponseDto dto = new StoreResponseDto();
                    dto.setId(store.getId());
                    dto.setName(store.getStoreName());
                    dto.setDescription(store.getStoreDescription());
                    dto.setAddress(store.getStoreAddress());
                    return dto;
                })
                .collect(Collectors.toList());

        // Lấy sản phẩm từ ImportTransactionDetail có remainQuantity > 0
        List<ImportTransactionDetail> availableDetails = detailRepository.findByRemainQuantityGreaterThan(0);
        List<ProductSaleResponseDto> products;

        if (!availableDetails.isEmpty()) {
            products = availableDetails.stream()
                    .map(productMapper::toDtoSale)
                    .collect(Collectors.toList());
        } else {
            // Fallback: lấy từ Product nếu không có ImportTransactionDetail
            products = productService.getAllProductSaleDto();
        }


        SaleTransactionCreateFormDataDto formData = new SaleTransactionCreateFormDataDto();
        formData.setCustomers(customers);
        formData.setProducts(products);
        return ResponseEntity.ok(formData);
    }

    @GetMapping("/product-response/{productId}")
    public ResponseEntity<List<ProductSaleResponseDto>> listAllProductResponseDtoByIdPro(@PathVariable Long productId) {
        // Kiểm tra sản phẩm có tồn tại không
        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product does not exist with ID: " + productId));

        List<ImportTransactionDetail> details = detailRepository.findCompletedDetailsWithQuantityByProductId(productId);
        if (details.isEmpty()) {
            throw new ResourceNotFoundException("No available lots found for product ID: " + productId);
        }
        List<ProductSaleResponseDto> result = details.stream()
                .map(productMapper::toDtoSale)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PostMapping("/save")
    public ResponseEntity<String> save(@RequestBody CreateSaleTransactionRequestDto dto, HttpServletRequest request) {
//        String token = jwtUtils.getJwtFromCookies(request);
//        if (token != null && jwtUtils.validateJwtToken(token)) {
//            Long userId = jwtUtils.getUserIdFromJwtToken(token);
//            saleTransactionService.save(dto,userId);
//        }
        saleTransactionService.save(dto,4L);

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

    @GetMapping("/next-code")
    public ResponseEntity<String> getNextImportTransactionCode() {
        // Lấy mã phiếu nhập tiếp theo từ service
        String nextCode = saleTransactionService.getNextSaleTransactionCode();
        return ResponseEntity.ok(nextCode);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelSaleTransaction(@PathVariable Long id) {
        saleTransactionService.cancel(id);
        return ResponseEntity.ok("Cancelled");
    }

    @DeleteMapping("/sort-delete/{id}")
    public ResponseEntity<String> softDeleteSaleTransaction(@PathVariable Long id, HttpServletRequest request) {
        String token = jwtUtils.getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            saleTransactionService.softDeleteSaleTransaction(id, userId);
            return ResponseEntity.ok("Soft delete successful");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token không hợp lệ");
    }
}

