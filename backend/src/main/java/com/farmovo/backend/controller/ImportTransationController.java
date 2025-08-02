package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.ImportTransactionNotFoundException;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.mapper.StoreMapper;
import com.farmovo.backend.models.ImportTransactionStatus;
import com.farmovo.backend.models.User;
import com.farmovo.backend.services.*;
import com.farmovo.backend.services.impl.JwtAuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.repositories.ImportTransactionRepository;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/import-transaction")
@RequiredArgsConstructor
public class ImportTransationController {

    private static final Logger log = LogManager.getLogger(ImportTransationController.class);

    private final CustomerService customerService;
    private final ProductService productService;
    private final ZoneService zoneService;
    private final StoreService storeService;
    private final ImportTransactionService importTransactionService;
    private final JwtUtils jwtUtils;
    private final StoreMapper storeMapper;
    private final JwtAuthenticationService jwtAuthenticationService;
    private final ImportTransactionRepository importTransactionRepository;

    @GetMapping("/create-form-data")
    public ResponseEntity<ImportTransactionCreateFormDataDto> getCreateFormData(HttpServletRequest request) {
        log.info("Getting create form data for import transaction");

        // Lấy thông tin người dùng từ JWT
        User user = jwtAuthenticationService.extractAuthenticatedUser(request);
        List<String> roles = jwtAuthenticationService.getUserRoles(user);
        List<CustomerDto> customers = customerService.getAllCustomerDto();
        List<ProductDto> products = productService.getAllProductDto();
        ////sửa từ ZoneDto thành ZoneResponseDto
        List<ZoneResponseDto> zones;
        List<StoreRequestDto> stores;

        if (roles.contains("MANAGER") || roles.contains("ADMIN")) {
            stores = storeService.getAllStoreDto();
            zones = zoneService.getAllZones(); // Load tất cả zones cho MANAGER/ADMIN
        }
        // Nếu là STAFF thì chỉ trả về store của họ
        else if (roles.contains("STAFF")) {
            if (user.getStore() == null) {
                throw new BadRequestException("Nhân viên chưa được phân công cửa hàng");
            }
            stores = List.of(storeMapper.toDto(user.getStore()));
            zones = zoneService.getZonesByStoreId(user.getStore().getId());
        } else {
            throw new BadRequestException("Người dùng không có quyền truy cập");
        }

        ImportTransactionCreateFormDataDto formData = new ImportTransactionCreateFormDataDto();
        formData.setCustomers(customers);
        formData.setProducts(products);
        formData.setZones(zones);
        formData.setStores(stores);

        log.debug("Form data prepared: {} customers, {} products, {} zones, {} stores",
                customers.size(), products.size(), zones.size(), stores.size());

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

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeImportTransaction(@PathVariable Long id) {
        log.info("Completing import transaction with ID: {}", id);

        try {
            importTransactionService.complete(id);
            log.info("Import transaction with ID: {} completed successfully", id);
            return ResponseEntity.ok("Completed");
        } catch (ImportTransactionNotFoundException e) {
            log.error("Import transaction not found for completion: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error completing import transaction: {}", id, e);
            throw new BadRequestException("Không thể hoàn thành phiếu nhập hàng: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/close-transaction")
    public ResponseEntity<?> closeImportTransaction(@PathVariable Long id) {
        log.info("Closing import transaction with ID: {}", id);

        try {
            importTransactionService.close(id);
            log.info("Import transaction with ID: {} closed successfully", id);
            return ResponseEntity.ok("Closed");
        } catch (ImportTransactionNotFoundException e) {
            log.error("Import transaction not found for closing: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error closing import transaction: {}", id, e);
            throw new BadRequestException("Không thể đóng phiếu nhập hàng: " + e.getMessage());
        }
    }

    @GetMapping("/list-all")
    public ResponseEntity<PageResponse<ImportTransactionResponseDto>> listAllImportTransaction(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String supplierName,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long staffId,
            @RequestParam(required = false) ImportTransactionStatus status,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) BigDecimal minTotalAmount,
            @RequestParam(required = false) BigDecimal maxTotalAmount,
            Pageable pageable
    ) {
        Page<ImportTransactionResponseDto> result = importTransactionService.listAllImportTransaction(
                name, supplierName, storeId, staffId, status,
                fromDate, toDate, minTotalAmount, maxTotalAmount, pageable
        );
        return ResponseEntity.ok(PageResponse.fromPage(result));
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
    public ResponseEntity<?> create(@RequestBody CreateImportTransactionRequestDto dto,
                                    HttpServletRequest request) {
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

    @DeleteMapping("/sort-delete/{id}")
    public ResponseEntity<String> softDeleteImportTransaction(@PathVariable Long id, HttpServletRequest request) {
        String token = jwtUtils.getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            importTransactionService.softDeleteImportTransaction(id, userId);
            return ResponseEntity.ok("Xóa mềm thành công");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token không hợp lệ");
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

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportImportTransactionPdf(@PathVariable Long id) {
        byte[] pdfBytes = importTransactionService.exportImportPdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename("phieu_nhap_" + id + ".pdf")
                .build());

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/recent")
    public List<ImportTransactionResponseDto> getRecentImports(@RequestParam(defaultValue = "5") int limit) {
        return importTransactionRepository.findRecentImports(org.springframework.data.domain.PageRequest.of(0, limit))
                .stream()
                .map(i -> {
                    ImportTransactionResponseDto dto = new ImportTransactionResponseDto();
                    dto.setId(i.getId());
                    dto.setName(i.getName());
                    dto.setTotalAmount(i.getTotalAmount());
                    dto.setPaidAmount(i.getPaidAmount());
                    dto.setImportTransactionNote(i.getImportTransactionNote());
                    dto.setStatus(i.getStatus());
                    dto.setImportDate(i.getImportDate());
                    dto.setSupplierId(i.getSupplier() != null ? i.getSupplier().getId() : null);
                    dto.setSupplierName(i.getSupplier() != null ? i.getSupplier().getName() : "");
                    dto.setStoreId(i.getStore() != null ? i.getStore().getId() : null);
                    dto.setStaffId(i.getStaff() != null ? i.getStaff().getId() : null);
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
