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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
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
        transaction.setStatus(ImportTransactionStatus.DRAFT);

        List<ImportTransactionDetail> detailList = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateImportTransactionRequestDto.DetailDto d : dto.getDetails()) {
            ImportTransactionDetail detail = new ImportTransactionDetail();
            detail.setImportTransaction(transaction); // liên kết FK
            detail.setProduct(productRepository.findById(d.getProductId()).orElseThrow());
            detail.setImportQuantity(d.getImportQuantity());
            detail.setRemainQuantity(d.getRemainQuantity());
            detail.setExpireDate(d.getExpireDate());
            detail.setUnitImportPrice(d.getUnitImportPrice());
            detail.setUnitSalePrice(d.getUnitSalePrice());

            // Cộng dồn tổng tiền
            BigDecimal lineTotal = d.getUnitImportPrice().multiply(BigDecimal.valueOf(d.getImportQuantity()));
            totalAmount = totalAmount.add(lineTotal);

            detailList.add(detail);
        }

        transaction.setDetails(detailList);
        transaction.setTotalAmount(totalAmount);
        transaction.setPaidAmount(BigDecimal.ZERO); // default nếu chưa thanh toán

        // Lưu
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

}
