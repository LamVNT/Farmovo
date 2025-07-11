package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import java.math.BigDecimal;
import java.util.List;

// Interface DebtNoteService
public interface DebtNoteService {
    List<DebtNoteResponseDto> findDebtNotesByCustomerId(Long customerId);
    DebtNoteResponseDto addDebtNote(DebtNoteRequestDto requestDto);
    DebtNoteResponseDto updateDebtNote(Long debtId, DebtNoteRequestDto requestDto);
    BigDecimal getTotalDebtByCustomerId(Long customerId);
    void createDebtNoteFromTransaction(Long customerId, BigDecimal debtAmount, String fromSource, String debtType, Long sourceId, Long storeId);

}