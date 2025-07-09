package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.models.ImportTransaction;

import java.util.List;

public interface ImportTransactionService {

    void createImportTransaction(CreateImportTransactionRequestDto dto);

    List<CreateImportTransactionRequestDto> listAllImportTransaction1();

    List<ImportTransactionResponseDto> listAllImportTransaction();


    CreateImportTransactionRequestDto getImportTransactionById(Long id);

//    List<ImportTransactionResponseDto> filterImportTransactions(String search, String status, String startDate, String endDate);
}
