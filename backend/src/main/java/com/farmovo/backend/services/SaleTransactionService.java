package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SaleTransactionService {

    List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(Long id);

    void save(CreateSaleTransactionRequestDto dto, Long userId);

    @Transactional
    void updateSaleTransaction(Long id, CreateSaleTransactionRequestDto dto);

    List<SaleTransactionResponseDto> getAll();

    void cancel(Long id);

    String getNextSaleTransactionCode();

    void softDeleteSaleTransaction(Long id, Long userId);

    SaleTransactionResponseDto getById(Long id);

    void complete(Long id);

    byte[] exportPdf(Long id);
}
