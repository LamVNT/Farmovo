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
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.ArrayList;
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

    @Autowired
    private StoreService storeService;


    @GetMapping("/create-form-data")
    public ResponseEntity<SaleTransactionCreateFormDataDto> getCreateFormData() {
        List<CustomerDto> customers = customerService.getAllCustomerDto();
        
        List<StoreResponseDto> stores = null;
        try {
            // Thử cách khác - sử dụng StoreController
            stores = new ArrayList<>();
            List<Store> storeEntities = storeService.getAllStores();
            System.out.println("Raw stores from service: " + storeEntities.size());
            
            for (Store store : storeEntities) {
                StoreResponseDto dto = new StoreResponseDto();
                dto.setId(store.getId());
                dto.setName(store.getStoreName());
                dto.setDescription(store.getStoreDescription());
                dto.setAddress(store.getStoreAddress());
                stores.add(dto);
            }
            System.out.println("Stores loaded successfully: " + stores.size());
        } catch (Exception e) {
            System.err.println("Error loading stores: " + e.getMessage());
            e.printStackTrace();
            // Fallback: tạo danh sách stores cứng để test
            stores = new ArrayList<>();
            StoreResponseDto store1 = new StoreResponseDto();
            store1.setId(1L);
            store1.setName("Farmovo Store A");
            store1.setDescription("Main store");
            store1.setAddress("123 Main St");
            stores.add(store1);
            
            StoreResponseDto store2 = new StoreResponseDto();
            store2.setId(2L);
            store2.setName("Farmovo Store B");
            store2.setDescription("Secondary store");
            store2.setAddress("456 Second St");
            stores.add(store2);
        }

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

    @GetMapping("/test-stores")
    public ResponseEntity<String> testStores() {
        try {
            List<Store> stores = storeService.getAllStores();
            StringBuilder result = new StringBuilder();
            result.append("=== STORE TEST ===\n");
            result.append("Total stores: ").append(stores.size()).append("\n");
            
            for (Store store : stores) {
                result.append("Store ID: ").append(store.getId())
                      .append(", Name: ").append(store.getStoreName())
                      .append(", Description: ").append(store.getStoreDescription())
                      .append(", Address: ").append(store.getStoreAddress())
                      .append("\n");
            }
            
            return ResponseEntity.ok(result.toString());
        } catch (Exception e) {
            return ResponseEntity.ok("Error testing stores: " + e.getMessage() + "\n" + e.getStackTrace());
        }
    }
}

