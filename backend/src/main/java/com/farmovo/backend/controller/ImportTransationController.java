package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.repositories.ImportTransactionRepository;
import com.farmovo.backend.services.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/import-transaction")
@RequiredArgsConstructor
public class ImportTransationController {

    private static final Logger logger = LogManager.getLogger(ImportTransationController.class);

    private final CustomerService customerService;
    private final ProductService productService;
    private final ZoneService zoneService;
    private final ImportTransactionService importTransactionService;
    private final JwtUtils jwtUtils;


    @GetMapping("/create-form-data")
    public ResponseEntity<ImportTransactionCreateFormDataDto> getCreateFormData() {
        List<CustomerDto> customers = customerService.getAllCustomerDto();
        List<ProductDto> products = productService.getAllProductDto();
        List<ZoneDto> zones = zoneService.getAllZoneDtos();

        ImportTransactionCreateFormDataDto formData = new ImportTransactionCreateFormDataDto();
        formData.setCustomers(customers);
        formData.setProducts(products);
        formData.setZones(zones);

        return ResponseEntity.ok(formData);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelImportTransaction(@PathVariable Long id) {
        importTransactionService.cancel(id);
        return ResponseEntity.ok("Cancelled");
    }

    @PutMapping("/{id}/open")
    public ResponseEntity<?> openImportTransaction(@PathVariable Long id) {
        importTransactionService.open(id);
        return ResponseEntity.ok("Opened");
    }

    @GetMapping("/list-all")
    public ResponseEntity<List<ImportTransactionResponseDto>> listAllImportTransaction() {

        List<ImportTransactionResponseDto> transactions = importTransactionService.listAllImportTransaction();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CreateImportTransactionRequestDto> getImportTransactionById(@PathVariable Long id) {
        CreateImportTransactionRequestDto dto = importTransactionService.getImportTransactionById(id);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/save")
    public ResponseEntity<?> create(@RequestBody CreateImportTransactionRequestDto dto, HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG IMPORT TRANSACTION CREATE ===");
            System.out.println("DTO: " + dto);
            System.out.println("Supplier ID: " + dto.getSupplierId());
            System.out.println("Store ID: " + dto.getStoreId());
            System.out.println("Staff ID: " + dto.getStaffId());
            System.out.println("Details count: " + (dto.getDetails() != null ? dto.getDetails().size() : 0));
            
        String token = jwtUtils.getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
                System.out.println("User ID: " + userId);
            importTransactionService.createImportTransaction(dto, userId);
        return ResponseEntity.ok("Tạo phiếu nhập thành công");
            } else {
                return ResponseEntity.badRequest().body("Token không hợp lệ");
            }
        } catch (Exception e) {
            System.err.println("Error creating import transaction: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }

    @GetMapping("/next-code")
    public ResponseEntity<String> getNextImportTransactionCode() {
        // Lấy mã phiếu nhập tiếp theo từ service
        String nextCode = importTransactionService.getNextImportTransactionCode();
        return ResponseEntity.ok(nextCode);
    }
    @PutMapping("/{id}")
    public ResponseEntity<String> updateImportTransaction(
            @PathVariable Long id,
            @RequestBody CreateImportTransactionRequestDto dto) {
        importTransactionService.update(id, dto);
        return ResponseEntity.ok("Import transaction updated successfully.");
    }
}
