package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.ResourceNotFoundException;
import com.farmovo.backend.exceptions.ImportTransactionNotFoundException;
import com.farmovo.backend.exceptions.TransactionStatusException;
import com.farmovo.backend.exceptions.CustomerNotFoundException;
import com.farmovo.backend.exceptions.StoreNotFoundException;
import com.farmovo.backend.mapper.ImportTransactionMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.ImportTransactionService;
import com.farmovo.backend.validator.ImportTransactionDetailValidator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportTransactionServiceImpl implements ImportTransactionService {

    private static final Logger log = LogManager.getLogger(ImportTransactionServiceImpl.class);

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ImportTransactionRepository importTransactionRepository;
    private final ImportTransactionMapper importTransactionMapper;
    private final ImportTransactionDetailValidator detailValidator;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createImportTransaction(CreateImportTransactionRequestDto dto, Long userId) {
        log.info("Start creating import transaction for supplierId={}, storeId={}, staffId={}, detailsCount={}",
                dto.getSupplierId(), dto.getStoreId(), dto.getStaffId(), 
                dto.getDetails() != null ? dto.getDetails().size() : 0);

        ImportTransaction transaction = new ImportTransaction();
        transaction.setSupplier(getSupplier(dto.getSupplierId()));
        transaction.setStore(getStore(dto.getStoreId()));
        transaction.setStaff(getStaff(dto.getStaffId()));
        transaction.setCreatedBy(userId);
        transaction.setImportTransactionNote(dto.getImportTransactionNote());
        transaction.setImportDate(LocalDateTime.now());
        transaction.setStatus(dto.getStatus() != null ? dto.getStatus() : ImportTransactionStatus.DRAFT);

        // Generate transaction code
        Long lastId = importTransactionRepository.findTopByOrderByIdDesc()
                .map(ImportTransaction::getId)
                .orElse(0L);
        String newName = String.format("PN%06d", lastId + 1);
        transaction.setName(newName);
        log.debug("Generated transaction code: {}", newName);

        List<ImportTransactionDetail> detailList = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateImportTransactionRequestDto.DetailDto d : dto.getDetails()) {
            log.debug("Processing detail: productId={}, quantity={}, unitPrice={}", 
                    d.getProductId(), d.getImportQuantity(), d.getUnitImportPrice());
            
            Product product = getProduct(d.getProductId());
            detailValidator.validate(d);
            ImportTransactionDetail detail = buildDetail(transaction, product, d);

            BigDecimal lineTotal = d.getUnitImportPrice().multiply(BigDecimal.valueOf(d.getImportQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            detailList.add(detail);
            log.debug("Added detail: productId={}, quantity={}, lineTotal={}", 
                    d.getProductId(), d.getImportQuantity(), lineTotal);
        }

        transaction.setDetails(detailList);
        transaction.setTotalAmount(totalAmount);
        transaction.setPaidAmount(dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO);

        ImportTransaction savedTransaction = importTransactionRepository.save(transaction);
        log.info("Import transaction created successfully. ID: {}, Code: {}, Total: {}, Paid: {}", 
                savedTransaction.getId(), savedTransaction.getName(), totalAmount, transaction.getPaidAmount());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, CreateImportTransactionRequestDto dto) {
        log.info("Updating import transaction with ID: {}, detailsCount={}", 
                id, dto.getDetails() != null ? dto.getDetails().size() : 0);
        
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Import transaction not found with ID: {}", id);
                    return new ImportTransactionNotFoundException("Import transaction not found with ID: " + id);
                });

        if (transaction.getStatus() != ImportTransactionStatus.DRAFT) {
            log.warn("Attempted to update non-DRAFT transaction with ID: {}, current status: {}", 
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "DRAFT", "cập nhật");
        }

        transaction.setSupplier(getSupplier(dto.getSupplierId()));
        transaction.setStore(getStore(dto.getStoreId()));
        transaction.setStaff(getStaff(dto.getStaffId()));
        transaction.setImportTransactionNote(dto.getImportTransactionNote());
        transaction.setImportDate(dto.getImportDate() != null ? dto.getImportDate() : LocalDateTime.now());
        transaction.setStatus(dto.getStatus());

        // Clear old details before adding new ones
        int oldDetailsCount = transaction.getDetails().size();
        transaction.getDetails().clear();
        log.debug("Cleared {} old details from transaction", oldDetailsCount);

        List<ImportTransactionDetail> newDetails = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateImportTransactionRequestDto.DetailDto d : dto.getDetails()) {
            log.debug("Processing update detail: productId={}, quantity={}, unitPrice={}", 
                    d.getProductId(), d.getImportQuantity(), d.getUnitImportPrice());
            
            Product product = getProduct(d.getProductId());
            detailValidator.validate(d);
            ImportTransactionDetail detail = buildDetail(transaction, product, d);

            BigDecimal lineTotal = d.getUnitImportPrice().multiply(BigDecimal.valueOf(d.getImportQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            newDetails.add(detail);
        }

        transaction.setDetails(newDetails);
        transaction.setTotalAmount(totalAmount);
        transaction.setPaidAmount(dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO);

        importTransactionRepository.save(transaction);
        log.info("Import transaction updated successfully. ID: {}, New details: {}, Total: {}", 
                id, newDetails.size(), totalAmount);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancel(Long id) {
        log.info("Cancelling import transaction with ID: {}", id);
        
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("ImportTransaction not found with ID: {}", id);
                    return new ImportTransactionNotFoundException("ImportTransaction not found with id: " + id);
                });
        
        ImportTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(ImportTransactionStatus.CANCEL);
        importTransactionRepository.save(transaction);
        
        log.info("Import transaction cancelled successfully. ID: {}, Old status: {}, New status: {}", 
                id, oldStatus, transaction.getStatus());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void open(Long id) {
        log.info("Opening import transaction with ID: {}", id);
        
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("ImportTransaction not found with ID: {}", id);
                    return new ImportTransactionNotFoundException("ImportTransaction not found with id: " + id);
                });
        
        if (transaction.getStatus() != ImportTransactionStatus.DRAFT) {
            log.warn("Attempted to open non-DRAFT transaction with ID: {}, current status: {}", 
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "DRAFT", "mở phiếu");
        }
        
        ImportTransactionStatus oldStatus = transaction.getStatus();
        transaction.setStatus(ImportTransactionStatus.WAITING_FOR_APPROVE);
        importTransactionRepository.save(transaction);
        
        log.info("Import transaction opened successfully. ID: {}, Old status: {}, New status: {}", 
                id, oldStatus, transaction.getStatus());
    }

    @Override
    public List<CreateImportTransactionRequestDto> listAllImportTransaction1() {
        log.debug("Getting all import transactions (method 1)");
        
        List<ImportTransaction> entities = importTransactionRepository.findAll();
        List<CreateImportTransactionRequestDto> result = entities.stream()
                .map(importTransactionMapper::toDto)
                .collect(Collectors.toList());
        
        log.debug("Retrieved {} import transactions", result.size());
        return result;
    }

    @Override
    public List<ImportTransactionResponseDto> listAllImportTransaction() {
        log.debug("Getting all import transactions (response DTOs)");
        
        List<ImportTransaction> entities = importTransactionRepository.findAll();
        List<ImportTransactionResponseDto> result = entities.stream()
                .map(importTransactionMapper::toResponseDto)
                .collect(Collectors.toList());
        
        log.debug("Retrieved {} import transactions", result.size());
        return result;
    }

    @Override
    public CreateImportTransactionRequestDto getImportTransactionById(Long id) {
        log.debug("Getting import transaction by ID: {}", id);
        
        ImportTransaction entity = importTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("ImportTransaction not found with ID: {}", id);
                    return new ImportTransactionNotFoundException("ImportTransaction not found with id: " + id);
                });
        
        CreateImportTransactionRequestDto result = importTransactionMapper.toDto(entity);
        log.debug("Retrieved import transaction with ID: {}", id);
        return result;
    }

    @Override
    public String getNextImportTransactionCode() {
        log.debug("Getting next import transaction code");
        
        Long lastId = importTransactionRepository.findTopByOrderByIdDesc()
                .map(ImportTransaction::getId)
                .orElse(0L);
        String nextCode = String.format("PN%06d", lastId + 1);
        
        log.debug("Generated next import transaction code: {}", nextCode);
        return nextCode;
    }

    // --- Helper methods ---

    private Customer getSupplier(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Supplier not found with ID: {}", id);
                    return new CustomerNotFoundException("Supplier not found with ID: " + id);
                });
    }

    private Store getStore(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Store not found with ID: {}", id);
                    return new StoreNotFoundException("Store not found with ID: " + id);
                });
    }

    private User getStaff(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Staff not found with ID: {}", id);
                    return new ResourceNotFoundException("Staff not found with ID: " + id);
                });
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Product not found with ID: {}", id);
                    return new ResourceNotFoundException("Product not found with ID: " + id);
                });
    }

    private ImportTransactionDetail buildDetail(ImportTransaction transaction, Product product,
                                                CreateImportTransactionRequestDto.DetailDto dto) {
        ImportTransactionDetail detail = new ImportTransactionDetail();
        detail.setImportTransaction(transaction);
        detail.setProduct(product);
        detail.setImportQuantity(dto.getImportQuantity());
        detail.setRemainQuantity(dto.getRemainQuantity());
        detail.setExpireDate(dto.getExpireDate());
        detail.setUnitImportPrice(dto.getUnitImportPrice());
        detail.setUnitSalePrice(dto.getUnitSalePrice());
        return detail;
    }
}
