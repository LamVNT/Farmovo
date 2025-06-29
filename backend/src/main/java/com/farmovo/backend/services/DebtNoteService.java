package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;

import java.util.List;

public interface DebtNoteService {

    DebtNoteResponseDto createDebtNote(DebtNoteRequestDto requestDto, Long createdBy);

    DebtNoteResponseDto getDebtNoteById(Long id);

    List<DebtNoteResponseDto> getAllDebtNotes();

    List<DebtNoteResponseDto> getDebtNotesByCustomerId(Long customerId);

    List<DebtNoteResponseDto> getDebtNotesByStoreId(Long storeId);

    DebtNoteResponseDto updateDebtNote(Long id, DebtNoteRequestDto requestDto);

    void softDeleteDebtNote(Long id, Long deletedBy);
}