package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.SaleTransactionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface SaleTransactionService {

    List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(Long id);

    void save(CreateSaleTransactionRequestDto dto, Long userId);

    @Transactional
    void updateSaleTransaction(Long id, CreateSaleTransactionRequestDto dto);

    Page<SaleTransactionResponseDto> getAll(String name,
                                            String customerName,
                                            String storeName,
                                            SaleTransactionStatus status,
                                            LocalDateTime fromDate,
                                            LocalDateTime toDate,
                                            BigDecimal minTotalAmount,
                                            BigDecimal maxTotalAmount,
                                            BigDecimal minPaidAmount,
                                            BigDecimal maxPaidAmount,
                                            String note,
                                            Long createdBy,
                                            Pageable pageable);


    void cancel(Long id);

    String getNextSaleTransactionCode();

    // Next code for balance transactions (PCB...)
    String getNextBalanceSaleTransactionCode();

    void softDeleteSaleTransaction(Long id, Long userId);

    SaleTransactionResponseDto getById(Long id);

    void complete(Long id);

    byte[] exportPdf(Long id);

    List<SaleTransaction> findRecentSales(PageRequest pageRequest);

    void open(Long id);

    void close(Long id);
}
