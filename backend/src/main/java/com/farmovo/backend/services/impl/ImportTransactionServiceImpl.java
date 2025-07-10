package com.farmovo.backend.services.impl;


import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.mapper.ImportTransactionMapper;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.ImportTransactionStatus;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.ImportTransactionService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
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



    @Transactional(rollbackFor = Exception.class)
    public void createImportTransaction(CreateImportTransactionRequestDto dto) {
        ImportTransaction transaction = new ImportTransaction();

        // Gắn thông tin cơ bản
        transaction.setSupplier(customerRepository.findById(dto.getSupplierId()).orElseThrow());
        transaction.setStore(storeRepository.findById(dto.getStoreId()).orElseThrow());
        transaction.setStaff(userRepository.findById(dto.getStaffId()).orElseThrow());
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

        List<ImportTransactionDetail> detailList = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateImportTransactionRequestDto.DetailDto d : dto.getDetails()) {
            ImportTransactionDetail detail = new ImportTransactionDetail();
            detail.setImportTransaction(transaction); // liên kết FK
            detail.setProduct(productRepository.findById(d.getProductId()).orElseThrow());
            detail.setImportQuantity(d.getImportQuantity()  );
            detail.setRemainQuantity(d.getRemainQuantity());
            detail.setExpireDate(d.getExpireDate());
            detail.setUnitImportPrice(d.getUnitImportPrice());
            detail.setUnitSalePrice(d.getUnitSalePrice());
            detail.setZones_id(d.getZones_id());

            // Cộng dồn tổng tiền
            BigDecimal lineTotal = d.getUnitImportPrice().multiply(BigDecimal.valueOf(d.getImportQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            detailList.add(detail);
        }

        transaction.setDetails(detailList);
        transaction.setTotalAmount(totalAmount);
        transaction.setPaidAmount(dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO);

        // Lưu
        importTransactionRepository.save(transaction);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(Long id, CreateImportTransactionRequestDto dto) {
        ImportTransaction transaction = importTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Import transaction not found with ID: " + id));

        if (transaction.getStatus() != ImportTransactionStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT transactions can be updated.");
        }

        // Cập nhật các trường chính
        transaction.setSupplier(
                customerRepository.findById(dto.getSupplierId())
                        .orElseThrow(() -> new RuntimeException("Supplier not found")));
        transaction.setStore(
                storeRepository.findById(dto.getStoreId())
                        .orElseThrow(() -> new RuntimeException("Store not found")));
        transaction.setStaff(
                userRepository.findById(dto.getStaffId())
                        .orElseThrow(() -> new RuntimeException("Staff not found")));
        transaction.setImportTransactionNote(dto.getImportTransactionNote());
        transaction.setImportDate(dto.getImportDate() != null ? dto.getImportDate() : LocalDateTime.now());
        transaction.setStatus(dto.getStatus());

        // Xóa toàn bộ detail cũ trước khi ghi đè
        transaction.getDetails().clear();

        List<ImportTransactionDetail> newDetails = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateImportTransactionRequestDto.DetailDto d : dto.getDetails()) {
            ImportTransactionDetail detail = new ImportTransactionDetail();
            detail.setImportTransaction(transaction);
            detail.setProduct(productRepository.findById(d.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found with ID: " + d.getProductId())));
            detail.setImportQuantity(d.getImportQuantity());
            detail.setRemainQuantity(d.getRemainQuantity()); // vẫn cần giữ để theo dõi
            detail.setExpireDate(d.getExpireDate());
            detail.setUnitImportPrice(d.getUnitImportPrice());
            detail.setUnitSalePrice(d.getUnitSalePrice());

            // Cộng dồn tổng tiền nhập
            BigDecimal lineTotal = d.getUnitImportPrice()
                    .multiply(BigDecimal.valueOf(d.getImportQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            newDetails.add(detail);
        }

        transaction.setDetails(newDetails);
        transaction.setTotalAmount(totalAmount);
        transaction.setPaidAmount(dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO);

        importTransactionRepository.save(transaction);
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
