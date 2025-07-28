package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.ImportTransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface ImportTransactionService {

    void createImportTransaction(CreateImportTransactionRequestDto dto, Long userId);

    @Transactional(rollbackFor = Exception.class)
    void update(Long id, CreateImportTransactionRequestDto dto);

    List<CreateImportTransactionRequestDto> listAllImportTransaction1();

//    List<ImportTransactionResponseDto> listAllImportTransaction();

    Page<ImportTransactionResponseDto> listAllImportTransaction(
            String name,
            String supplierName,
            Long storeId,
            Long staffId,
            ImportTransactionStatus status,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            BigDecimal minTotalAmount,
            BigDecimal maxTotalAmount,
            Pageable pageable
    );

    CreateImportTransactionRequestDto getImportTransactionById(Long id);

    void cancel(Long id);

    void open(Long id);

    void complete(Long id);

    void close(Long id);

    String getNextImportTransactionCode();

    void softDeleteImportTransaction(Long id, Long userId);

    byte[] exportImportPdf(Long id);
}
