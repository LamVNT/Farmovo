package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.models.ImportTransaction;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ImportTransactionService {

    void createImportTransaction(CreateImportTransactionRequestDto dto);

    @Transactional(rollbackFor = Exception.class)
    void update(Long id, CreateImportTransactionRequestDto dto);

    List<CreateImportTransactionRequestDto> listAllImportTransaction1();

    List<ImportTransactionResponseDto> listAllImportTransaction();


    CreateImportTransactionRequestDto getImportTransactionById(Long id);
}
