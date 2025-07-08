package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;

import java.util.List;

public interface SaleTransactionService {

    List<ProductResponseDto> listAllProductResponseDtoByIdPro(Long id);

    void save(CreateSaleTransactionRequestDto dto);

    List<SaleTransactionResponseDto> getAll();

}
