package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import com.farmovo.backend.exceptions.*;
import com.farmovo.backend.jwt.JwtUtils;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.mapper.StoreMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.services.*;
import com.farmovo.backend.services.impl.JwtAuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import com.farmovo.backend.repositories.SaleTransactionRepository;

@RestController
@RequestMapping("/api/sale-transactions")
@RequiredArgsConstructor
public class SaleTransactionController {

    private static final Logger log = LogManager.getLogger(SaleTransactionController.class);

    private final ImportTransactionDetailRepository detailRepository;
    private final ProductMapper productMapper;
    private final SaleTransactionService saleTransactionService;
    private final CustomerService customerService;
    private final ProductService productService;
    private final StoreService storeService;
    private final ProductRepository productRepository;
    private final JwtUtils jwtUtils;
    private final JwtAuthenticationService jwtAuthenticationService;
    private final StoreMapper storeMapper;
    private final ImportTransactionDetailService importTransactionDetailService;
    private final SaleTransactionRepository saleTransactionRepository;


    @GetMapping("/create-form-data")
    public ResponseEntity<SaleTransactionCreateFormDataDto> getCreateFormData(HttpServletRequest request) {
        log.info("Getting create form data for sale transaction");

        User user = jwtAuthenticationService.extractAuthenticatedUser(request);
        List<String> roles = jwtAuthenticationService.getUserRoles(user);
        List<CustomerDto> customers = customerService.getAllCustomerDto();
        List<StoreResponseDto> stores;

        if (roles.contains("MANAGER") || roles.contains("ADMIN")) {
            stores = storeService.getAllStoreResponseDto();
        }
        // Nếu là STAFF thì chỉ trả về store của họ
        else if (roles.contains("STAFF")) {
            if (user.getStore() == null) {
                throw new BadRequestException("Nhân viên chưa được phân công cửa hàng");
            }
            stores = List.of(storeMapper.toResponseDto(user.getStore()));
        } else {
            throw new BadRequestException("Người dùng không có quyền truy cập");
        }

        log.info("Danh sách cửa hàng trả về (số lượng={}):", stores.size());
        stores.forEach(store -> log.info("Store ID: {}, Name: {}, Address: {}",
                store.getId(), store.getStoreName(), store.getStoreAddress()));
        // Lấy sản phẩm từ ImportTransactionDetail có remainQuantity > 0
        List<ProductSaleResponseDto> products = importTransactionDetailService.getAvailableProductsForSale();

        SaleTransactionCreateFormDataDto formData = new SaleTransactionCreateFormDataDto();
        formData.setCustomers(customers);
        formData.setStores(stores);
        formData.setProducts(products);

        log.debug("Form data prepared: {} customers, {} stores, {} products",
                customers.size(), stores.size(), products.size());
        return ResponseEntity.ok(formData);
    }

    @GetMapping("/product-response/{productId}")
    public ResponseEntity<List<ProductSaleResponseDto>> listAllProductResponseDtoByIdPro(@PathVariable Long productId) {
        log.info("Getting product response details for product ID: {}", productId);

        productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product does not exist with ID: " + productId));

        List<ImportTransactionDetail> details = detailRepository.findCompletedDetailsWithQuantityByProductId(productId);
        if (details.isEmpty()) {
            throw new ResourceNotFoundException("No available lots found for product ID: " + productId);
        }

        List<ProductSaleResponseDto> result = details.stream()
                .map(productMapper::toDtoSale)
                .collect(Collectors.toList());

        log.debug("Found {} available details for product ID: {}", result.size(), productId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/save")
    public ResponseEntity<String> save(@RequestBody CreateSaleTransactionRequestDto dto, HttpServletRequest request) {
        log.info("Creating new sale transaction for customerId={}, storeId={}, totalAmount={}",
                dto.getCustomerId(), dto.getStoreId(), dto.getTotalAmount());

        String token = jwtUtils.getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            log.debug("User ID from token: {}", userId);

            saleTransactionService.save(dto, userId);

            log.info("Sale transaction created successfully by user: {}", userId);
            return ResponseEntity.ok("Sale transaction saved successfully.");
        } else {
            log.warn("Invalid or missing JWT token in request");
            throw new BadRequestException("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    @PostMapping("/save-from-balance")
    public ResponseEntity<String> saveFromBalance(@RequestBody CreateSaleTransactionRequestDto dto, HttpServletRequest request) {
        log.info("Creating BALANCE sale transaction");

        String token = jwtUtils.getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            Long userId = jwtUtils.getUserIdFromJwtToken(token);
            saleTransactionService.save(dto, userId); // Giữ nguyên service hiện tại
            return ResponseEntity.ok("Sale transaction (balance) saved successfully.");
        } else {
            throw new BadRequestException("Token không hợp lệ hoặc đã hết hạn");
        }
    }

    @GetMapping("/list-all")
    public ResponseEntity<PageResponse<SaleTransactionResponseDto>> listAllSaleTransactions(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String customerName,
            @RequestParam(required = false) String storeName,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) SaleTransactionStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) BigDecimal minTotalAmount,
            @RequestParam(required = false) BigDecimal maxTotalAmount,
            @RequestParam(required = false) BigDecimal minPaidAmount,
            @RequestParam(required = false) BigDecimal maxPaidAmount,
            @RequestParam(required = false) String note,
            @RequestParam(required = false) Long createdBy,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String direction,
            @PageableDefault(page = 0, size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        // Enforce staff-only store scoping
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(null);
            List<String> roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore().getId() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {}

        // Xử lý sắp xếp tùy chỉnh từ frontend
        Pageable customPageable = pageable;
        if (sort != null && direction != null) {
            Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? 
                Sort.Direction.DESC : Sort.Direction.ASC;
            Sort customSort = Sort.by(sortDirection, sort);
            customPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), customSort);
        }

        Page<SaleTransactionResponseDto> result = saleTransactionService.getAll(
                name, customerName, storeName, storeId, status, fromDate,
                toDate, minTotalAmount, maxTotalAmount, minPaidAmount,
                maxPaidAmount, note, createdBy, customPageable
        );
        return ResponseEntity.ok(PageResponse.fromPage(result));
    }


    @GetMapping("/{id}")
    public ResponseEntity<SaleTransactionResponseDto> getSaleTransactionById(@PathVariable Long id) {
        SaleTransactionResponseDto result = saleTransactionService.getById(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stocktake/{stocktakeId}/status")
    public ResponseEntity<Map<String, Object>> getPcbStatusByStocktakeId(@PathVariable Long stocktakeId) {
        try {
            // Kiểm tra xem có PCB nào liên kết với stocktake này không
            List<SaleTransaction> pcbs = saleTransactionRepository.findByStocktakeId(stocktakeId);
            
            if (pcbs.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "hasBalance", false,
                    "status", null,
                    "message", "Không có PCB nào liên kết với stocktake này"
                ));
            }
            
            // Lấy PCB đầu tiên (theo thiết kế, mỗi stocktake chỉ có 1 PCB)
            SaleTransaction pcb = pcbs.get(0);
            
            return ResponseEntity.ok(Map.of(
                "hasBalance", true,
                "status", pcb.getStatus().toString(),
                "pcbId", pcb.getId(),
                "pcbName", pcb.getName(),
                "createdAt", pcb.getCreatedAt(),
                "updatedAt", pcb.getUpdatedAt()
            ));
            
        } catch (Exception e) {
            log.error("Error getting PCB status for stocktake {}: {}", stocktakeId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Không thể lấy trạng thái PCB"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateSaleTransaction(
            @PathVariable Long id,
            @RequestBody CreateSaleTransactionRequestDto dto) {
        log.info("Updating sale transaction with ID: {}", id);

        saleTransactionService.updateSaleTransaction(id, dto);

        log.info("Sale transaction with ID: {} updated successfully", id);
        return ResponseEntity.ok("Sale transaction updated successfully");
    }

    @GetMapping("/next-code")
    public ResponseEntity<String> getNextImportTransactionCode() {
        String nextCode = saleTransactionService.getNextSaleTransactionCode();
        return ResponseEntity.ok(nextCode);
    }

    @GetMapping("/next-code-balance")
    public ResponseEntity<String> getNextBalanceSaleTransactionCode() {
        String nextCode = saleTransactionService.getNextBalanceSaleTransactionCode();
        return ResponseEntity.ok(nextCode);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelSaleTransaction(@PathVariable Long id) {
        saleTransactionService.cancel(id);
        return ResponseEntity.ok("Cancelled");
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeSaleTransaction(@PathVariable Long id) {
        saleTransactionService.complete(id);
        return ResponseEntity.ok("Completed");
    }

    @PutMapping("/{id}/open")
    public ResponseEntity<?> openSaleTransaction(@PathVariable Long id) {
        log.info("Opening import transaction with ID: {}", id);

        try {
            saleTransactionService.open(id);
            log.info("Sale transaction with ID: {} opened successfully", id);
            return ResponseEntity.ok("Opened");
        } catch (ImportTransactionNotFoundException e) {
            log.error("Sale transaction not found for opening: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error opening import transaction: {}", id, e);
            throw new BadRequestException("Không thể mở phiếu ban hàng: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/close-transaction")
    public ResponseEntity<?> closeSaleTransaction(@PathVariable Long id) {
        log.info("Closing import transaction with ID: {}", id);

        try {
            saleTransactionService.close(id);
            log.info("Sale transaction with ID: {} closed successfully", id);
            return ResponseEntity.ok("Closed");
        } catch (ImportTransactionNotFoundException e) {
            log.error("Sale transaction not found for closing: {}", id);
            throw e;
        } catch (Exception e) {
            log.error("Error closing sale transaction: {}", id, e);
            throw new BadRequestException("Không thể đóng phiếu nhập hàng: " + e.getMessage());
        }
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

    @GetMapping("/{id}/export-pdf")
    public ResponseEntity<byte[]> exportSaleTransactionPdf(@PathVariable Long id) {
        byte[] pdfBytes = saleTransactionService.exportPdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "sale-transaction-" + id + ".pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }

    @GetMapping("/recent")
    public List<SaleTransactionResponseDto> getRecentSales(@RequestParam(defaultValue = "5") int limit) {
        return saleTransactionService.findRecentSales(org.springframework.data.domain.PageRequest.of(0, limit))
                .stream()
                .map(s -> {
                    SaleTransactionResponseDto dto = new SaleTransactionResponseDto();
                    dto.setId(s.getId());
                    dto.setName(s.getName());
                    dto.setTotalAmount(s.getTotalAmount());
                    dto.setPaidAmount(s.getPaidAmount());
                    dto.setSaleTransactionNote(s.getSaleTransactionNote());
                    dto.setStatus(s.getStatus());
                    dto.setSaleDate(s.getSaleDate());
                    dto.setCustomerName(s.getCustomer() != null ? s.getCustomer().getName() : "");
                    dto.setCustomerPhone(s.getCustomer() != null ? s.getCustomer().getPhone() : "");
                    dto.setCustomerAddress(s.getCustomer() != null ? s.getCustomer().getAddress() : "");
                    dto.setStoreName(s.getStore() != null ? s.getStore().getStoreName() : "");
                    dto.setStoreAddress(s.getStore() != null ? s.getStore().getStoreAddress() : "");
                    dto.setCreatedBy(s.getCreatedBy());
                    // Không set detail để tránh vòng lặp
                    return dto;
                })
                .collect(Collectors.toList());
    }
}

