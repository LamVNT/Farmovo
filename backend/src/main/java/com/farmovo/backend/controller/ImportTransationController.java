package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.*;
import com.farmovo.backend.dto.response.ImportTransactionCreateFormDataDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.repositories.ImportTransactionRepository;
import com.farmovo.backend.services.*;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
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

//    @GetMapping("/listAll")
//    public ResponseEntity<List<CreateImportTransactionRequestDto>> listAllImportTransaction() {
//        List<CreateImportTransactionRequestDto> transactions = importTransactionService.listAllImportTransaction();
//        return ResponseEntity.ok(transactions);
//    }

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
}
