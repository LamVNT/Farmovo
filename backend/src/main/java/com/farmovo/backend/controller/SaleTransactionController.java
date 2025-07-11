package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.dto.request.SaleTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.services.*;
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
    private final SaleTransactionService saleTransactionService;
    private final CustomerService customerService;
    private final ProductService productService;
    private final ZoneService zoneService;
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

        // Debug logging
        System.out.println("=== DEBUG SALE TRANSACTION CREATE FORM DATA ===");
        System.out.println("Customers count: " + customers.size());
        System.out.println("Stores count: " + stores.size());
        System.out.println("Products count: " + products.size());
        System.out.println("Available details count: " + availableDetails.size());

        if (!products.isEmpty()) {
            System.out.println("First product: " + products.get(0));
        }

        SaleTransactionCreateFormDataDto formData = new SaleTransactionCreateFormDataDto();
        formData.setCustomers(customers);
        formData.setStores(stores);
        formData.setProducts(products);
        return ResponseEntity.ok(formData);
    }

    @GetMapping("/product-response/{productId}")
    public List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(@PathVariable Long productId) {
        List<ImportTransactionDetail> details = detailRepository.findByProductIdAndRemainQuantityGreaterThan(productId, 0);
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

    @GetMapping("/test-data")
    public ResponseEntity<String> testData() {
        List<ImportTransactionDetail> allDetails = detailRepository.findAll();
        List<ImportTransactionDetail> availableDetails = detailRepository.findByRemainQuantityGreaterThan(0);

        StringBuilder result = new StringBuilder();
        result.append("=== TEST DATA ===\n");
        result.append("Total ImportTransactionDetail: ").append(allDetails.size()).append("\n");
        result.append("Available details (remainQuantity > 0): ").append(availableDetails.size()).append("\n");

        if (!availableDetails.isEmpty()) {
            result.append("\nFirst available detail:\n");
            ImportTransactionDetail first = availableDetails.get(0);
            result.append("ID: ").append(first.getId()).append("\n");
            result.append("Product ID: ").append(first.getProduct().getId()).append("\n");
            result.append("Product Name: ").append(first.getProduct().getProductName()).append("\n");
            result.append("Remain Quantity: ").append(first.getRemainQuantity()).append("\n");
            result.append("Unit Sale Price: ").append(first.getUnitSalePrice()).append("\n");
        }

        return ResponseEntity.ok(result.toString());
    }
}

