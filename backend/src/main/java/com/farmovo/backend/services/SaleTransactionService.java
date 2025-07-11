package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface SaleTransactionService {

    List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(Long id);

    void save(CreateSaleTransactionRequestDto dto);

    @Transactional
    void updateSaleTransaction(Long id, CreateSaleTransactionRequestDto dto);

    List<SaleTransactionResponseDto> getAll();

}
