package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.CustomerRequestDto;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import com.farmovo.backend.services.CustomerService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/customer")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class CustomerController {
    private static final Logger logger = LogManager.getLogger(CustomerController.class);

    @Autowired
    private CustomerService customerService;

    @PostMapping
    public ResponseEntity<CustomerResponseDto> createCustomer(@RequestBody CustomerRequestDto requestDto,
                                                              @RequestParam Long createdBy) {
        logger.info("Creating customer: {}", requestDto.getName());
        CustomerResponseDto responseDto = customerService.createCustomer(requestDto, createdBy);
        return new ResponseEntity<>(responseDto, HttpStatus.CREATED);
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<CustomerResponseDto> getCustomerById(@PathVariable Long id) {
        logger.info("Fetching customer with ID: {}", id);
        CustomerResponseDto responseDto = customerService.getCustomerById(id);
        return new ResponseEntity<>(responseDto, HttpStatus.OK);
    }

    @GetMapping("/admin/customerList")
    public ResponseEntity<List<CustomerResponseDto>> getAllCustomers() {
        logger.info("Fetching all customers from table 'customers'");
        return new ResponseEntity<>(customerService.getAllCustomers().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList()), HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<List<CustomerResponseDto>> searchCustomersByName(@RequestParam String name) {
        logger.info("Searching customers by name: {}", name);
        return new ResponseEntity<>(customerService.searchCustomersByName(name).stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList()), HttpStatus.OK);
    }

    @GetMapping("/details/{customerId}")
    public ResponseEntity<CustomerResponseDto> getCustomerDetailsById(@PathVariable Long customerId) {
        logger.info("Fetching customer details with ID: {}", customerId);
        CustomerResponseDto responseDto = customerService.getCustomerById(customerId);
        return new ResponseEntity<>(responseDto, HttpStatus.OK);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerResponseDto> updateCustomer(@PathVariable Long id,
                                                              @RequestBody CustomerRequestDto requestDto) {
        logger.info("Updating customer with ID: {}", id);
        CustomerResponseDto responseDto = customerService.updateCustomer(id, requestDto);
        return new ResponseEntity<>(responseDto, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> softDeleteCustomer(@PathVariable Long id,
                                                   @RequestParam Long deletedBy) {
        logger.info("Soft deleting customer with ID: {}", id);
        customerService.softDeleteCustomer(id, deletedBy);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @PostMapping("/admin/upload-evidence")
    public ResponseEntity<String> uploadEvidence(@RequestParam("file") MultipartFile file) {
        logger.debug("Received request to upload evidence file: {}", file.getOriginalFilename());
        try {

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

            logger.info("Successfully uploaded evidence file: {}", fileName);
            return ResponseEntity.ok(fileName);
        } catch (Exception e) {
            logger.error("Failed to upload evidence file. Error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload file: " + e.getMessage());
        }
    }

    private CustomerResponseDto convertToResponseDTO(CustomerResponseDto dto) {
        return dto; // Pass-through method
    }
    @GetMapping("/suppliers")
    public ResponseEntity<List<CustomerResponseDto>> getSuppliers() {
        logger.info("Fetching all suppliers (isSupplier=true)");
        return new ResponseEntity<>(
                customerService.getAllCustomers().stream()
                        .filter(CustomerResponseDto::getIsSupplier)
                        .collect(Collectors.toList()),
                HttpStatus.OK
        );
    }

}