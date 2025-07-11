package com.farmovo.backend.services.impl;


import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.ResourceNotFoundException;
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

    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;
    private final ImportTransactionRepository importTransactionRepository;
    private final ImportTransactionMapper importTransactionMapper;
    private final ImportTransactionDetailValidator detailValidator;
    private static final Logger log = LogManager.getLogger(ImportTransactionService.class);


    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createImportTransaction(CreateImportTransactionRequestDto dto, Long userId) {
        log.info("Start creating import transaction for supplierId={}, storeId={}, staffId={}",
                dto.getSupplierId(), dto.getStoreId(), dto.getStaffId());

        ImportTransaction transaction = new ImportTransaction();
        transaction.setSupplier(getSupplier(dto.getSupplierId()));
        transaction.setStore(getStore(dto.getStoreId()));
        transaction.setStaff(getStaff(dto.getStaffId()));
        transaction.setCreatedBy(userId);
        transaction.setImportTransactionNote(dto.getImportTransactionNote());
        transaction.setImportDate(LocalDateTime.now());
        transaction.setStatus(dto.getStatus() != null ? dto.getStatus() : ImportTransactionStatus.DRAFT);
        transaction.setCreatedBy(dto.getCreatedBy());

        // Sinh mã name tự động
        Long lastId = importTransactionRepository.findTopByOrderByIdDesc()
                .map(ImportTransaction::getId)
                .orElse(0L);
        String newName = String.format("PN%06d", lastId + 1);
        transaction.setName(newName);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<ImportTransactionDetail> detailList = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateImportTransactionRequestDto.DetailDto d : dto.getDetails()) {
            Product product = getProduct(d.getProductId());
            detailValidator.validate(d);
            ImportTransactionDetail detail = buildDetail(transaction, product, d);

            BigDecimal lineTotal = d.getUnitImportPrice().multiply(BigDecimal.valueOf(d.getImportQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            detailList.add(detail);
            log.debug("Added detail: productId={}, quantity={}, lineTotal={}", d.getProductId(), d.getImportQuantity(), lineTotal);
        }

        transaction.setDetails(detailList);
        transaction.setTotalAmount(totalAmount);
        transaction.setPaidAmount(dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO);

        // Lưu
        importTransactionRepository.save(transaction);
        log.info("Import transaction created. Total: {}, Paid: {}", totalAmount, transaction.getPaidAmount());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, CreateImportTransactionRequestDto dto) {
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Import transaction not found with ID: " + id));

        if (transaction.getStatus() != ImportTransactionStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT transactions can be updated.");
        }

        transaction.setSupplier(getSupplier(dto.getSupplierId()));
        transaction.setStore(getStore(dto.getStoreId()));
        transaction.setStaff(getStaff(dto.getStaffId()));
        transaction.setImportTransactionNote(dto.getImportTransactionNote());
        transaction.setImportDate(dto.getImportDate() != null ? dto.getImportDate() : LocalDateTime.now());
        transaction.setStatus(dto.getStatus());

        // Xóa toàn bộ detail cũ trước khi ghi đè
        transaction.getDetails().clear();

        List<ImportTransactionDetail> newDetails = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateImportTransactionRequestDto.DetailDto d : dto.getDetails()) {
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
        log.info("Import transaction updated successfully with ID: {}", id);
    }

    // --- Helper methods ---

    private Customer getSupplier(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Supplier not found with ID: {}", id);
                    return new ResourceNotFoundException("Supplier not found with ID: " + id);
                });
    }

    private Store getStore(Long id) {
        return storeRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Store not found with ID: {}", id);
                    return new ResourceNotFoundException("Store not found with ID: " + id);
                });
    }

    private User getStaff(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Staff not found with ID: {}", id);
                    return new ResourceNotFoundException("Staff not found with ID: " + id);
                });
    }

    private Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Product not found with ID: {}", id);
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
    @Transactional(rollbackFor = Exception.class)
    public void cancel(Long id) {
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ImportTransaction not found with id: " + id));
        transaction.setStatus(ImportTransactionStatus.CANCEL);
        // updatedAt sẽ tự động cập nhật nhờ @UpdateTimestamp
        importTransactionRepository.save(transaction);
    }

    @Transactional(rollbackFor = Exception.class)
    public void open(Long id) {
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ImportTransaction not found with id: " + id));
        if (transaction.getStatus() != ImportTransactionStatus.DRAFT) {
            throw new RuntimeException("Chỉ có thể mở phiếu khi trạng thái là Nháp (DRAFT)");
        }
        transaction.setStatus(ImportTransactionStatus.WAITING_FOR_APPROVE);
        // updatedAt sẽ tự động cập nhật nhờ @UpdateTimestamp
        importTransactionRepository.save(transaction);
    }

    @Override
    public List<CreateImportTransactionRequestDto> listAllImportTransaction1() {
        List<ImportTransaction> entities = importTransactionRepository.findAll();
        return entities.stream()
                .map(importTransactionMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<ImportTransactionResponseDto> listAllImportTransaction() {
        List<ImportTransaction> entities = importTransactionRepository.findAll();
        return entities.stream()
                .map(importTransactionMapper::toResponseDto)
                .collect(Collectors.toList());
    }


    @Override
    public CreateImportTransactionRequestDto getImportTransactionById(Long id) {
        ImportTransaction entity = importTransactionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("ImportTransaction not found with id: " + id));
        return importTransactionMapper.toDto(entity);
    }

    @Override
    public String getNextImportTransactionCode() {
        Long lastId = importTransactionRepository.findTopByOrderByIdDesc()
                .map(ImportTransaction::getId)
                .orElse(0L);
        return String.format("PN%06d", lastId + 1);
    }

//    @Override
//    public List<ImportTransactionResponseDto> filterImportTransactions(String search, String status, String startDate, String endDate) {
//        return List.of();
//    }


}
