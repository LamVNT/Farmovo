package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.ImportTransactionNotFoundException;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.services.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/import-transaction")
@RequiredArgsConstructor
public class ImportTransationController {

    private static final Logger log = LogManager.getLogger(ImportTransationController.class);

    private final CustomerService customerService;
    private final ProductService productService;
    private final ZoneService zoneService;
    private final ImportTransactionService importTransactionService;
    private final JwtUtils jwtUtils;

    @GetMapping("/create-form-data")
    public ResponseEntity<ImportTransactionCreateFormDataDto> getCreateFormData() {
        log.info("Getting create form data for import transaction");
        
        List<CustomerDto> customers = customerService.getAllCustomerDto();
        List<ProductDto> products = productService.getAllProductDto();
        List<ZoneDto> zones = zoneService.getAllZoneDtos();

        ImportTransactionCreateFormDataDto formData = new ImportTransactionCreateFormDataDto();
        formData.setCustomers(customers);
        formData.setProducts(products);
        formData.setZones(zones);

        log.debug("Form data prepared: {} customers, {} products, {} zones", 
                customers.size(), products.size(), zones.size());
        
        return ResponseEntity.ok(formData);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelImportTransaction(@PathVariable Long id) {
        log.info("Cancelling import transaction with ID: {}", id);
        
        try {
            importTransactionService.cancel(id);
            log.info("Import transaction with ID: {} cancelled successfully", id);
            return ResponseEntity.ok("Cancelled");
        } catch (ImportTransactionNotFoundException e) {
            log.error("Import transaction not found for cancellation: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error cancelling import transaction: {}", id, e);
            throw new BadRequestException("Không thể hủy phiếu nhập hàng: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/open")
    public ResponseEntity<?> openImportTransaction(@PathVariable Long id) {
        log.info("Opening import transaction with ID: {}", id);
        
        try {
            importTransactionService.open(id);
            log.info("Import transaction with ID: {} opened successfully", id);
            return ResponseEntity.ok("Opened");
        } catch (ImportTransactionNotFoundException e) {
            log.error("Import transaction not found for opening: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error opening import transaction: {}", id, e);
            throw new BadRequestException("Không thể mở phiếu nhập hàng: " + e.getMessage());
        }
    }

    @GetMapping("/list-all")
    public ResponseEntity<List<ImportTransactionResponseDto>> listAllImportTransaction() {
        log.info("Getting all import transactions");
        
        List<ImportTransactionResponseDto> transactions = importTransactionService.listAllImportTransaction();
        
        log.debug("Retrieved {} import transactions", transactions.size());
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CreateImportTransactionRequestDto> getImportTransactionById(@PathVariable Long id) {
            log.info("Getting import transaction by ID: {}", id);
        
        try {
            CreateImportTransactionRequestDto dto = importTransactionService.getImportTransactionById(id);
            log.debug("Retrieved import transaction with ID: {}", id);
            return ResponseEntity.ok(dto);
        } catch (ImportTransactionNotFoundException e) {
            log.error("Import transaction not found: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error retrieving import transaction: {}", id, e);
            throw new BadRequestException("Không thể lấy thông tin phiếu nhập hàng: " + e.getMessage());
        }
    }

    @PostMapping("/save")
    public ResponseEntity<?> create(@RequestBody CreateImportTransactionRequestDto dto, HttpServletRequest request) {
        log.info("Creating new import transaction for supplierId={}, storeId={}, staffId={}", 
                dto.getSupplierId(), dto.getStoreId(), dto.getStaffId());
        
        String token = jwtUtils.getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            log.debug("User ID from token: {}", userId);
            
            try {
                importTransactionService.createImportTransaction(dto, userId);
                log.info("Import transaction created successfully by user: {}", userId);
                return ResponseEntity.ok("Tạo phiếu nhập thành công");
            } catch (Exception e) {
                log.error("Error creating import transaction", e);
                throw new BadRequestException("Không thể tạo phiếu nhập hàng: " + e.getMessage());
            }
        } else {
            log.warn("Invalid or missing JWT token in request");
            throw new BadRequestException("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    @GetMapping("/next-code")
    public ResponseEntity<String> getNextImportTransactionCode() {
        log.debug("Getting next import transaction code");
        
        String nextCode = importTransactionService.getNextImportTransactionCode();
        
        log.debug("Next import transaction code: {}", nextCode);
        return ResponseEntity.ok(nextCode);
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateImportTransaction(
            @PathVariable Long id,
            @RequestBody CreateImportTransactionRequestDto dto) {
        log.info("Updating import transaction with ID: {}", id);
        
        try {
            importTransactionService.update(id, dto);
            log.info("Import transaction with ID: {} updated successfully", id);
            return ResponseEntity.ok("Import transaction updated successfully.");
        } catch (ImportTransactionNotFoundException e) {
            log.error("Import transaction not found for update: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error updating import transaction: {}", id, e);
            throw new BadRequestException("Không thể cập nhật phiếu nhập hàng: " + e.getMessage());
        }
    }
}
