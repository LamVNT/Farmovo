package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.request.ZoneDto;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.services.*;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/importtransaction")
public class ImportTransationController {

    private static final Logger logger = LogManager.getLogger(ImportTransationController.class);

    @Autowired
    private CustomerService customerService;

    @Autowired
    private ProductService productService;

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private ImportTransactionService importTransactionService;

    @Autowired
    private ImportTransactionDetailService importTransactionDetailService;

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

    @PutMapping("/{id}")
    public ResponseEntity<String> updateImportTransaction(
            @PathVariable Long id,
            @RequestBody CreateImportTransactionRequestDto dto) {
        importTransactionService.update(id, dto);
        return ResponseEntity.ok("Import transaction updated successfully.");
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

    @PostMapping("")
    public ResponseEntity<?> create(@RequestBody CreateImportTransactionRequestDto dto) {
        importTransactionService.createImportTransaction(dto);
        return ResponseEntity.ok("Tạo phiếu nhập thành công");
    }

    @GetMapping("/next-code")
    public ResponseEntity<String> getNextImportTransactionCode() {
        // Lấy mã phiếu nhập tiếp theo từ service
        String nextCode = importTransactionService.getNextImportTransactionCode();
        return ResponseEntity.ok(nextCode);
    }

}
