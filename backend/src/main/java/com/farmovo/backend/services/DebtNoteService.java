package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

// Interface DebtNoteService
public interface DebtNoteService {
    List<DebtNoteResponseDto> findDebtNotesByCustomerId(Long customerId);
    DebtNoteResponseDto addDebtNote(DebtNoteRequestDto requestDto);
    DebtNoteResponseDto updateDebtNote(Long debtId, DebtNoteRequestDto requestDto);
    BigDecimal getTotalDebtByCustomerId(Long customerId);
    BigDecimal getTotalImportDebtByCustomerId(Long customerId);  // Mới: Tổng nợ import (debtType = '+')
    BigDecimal getTotalSaleDebtByCustomerId(Long customerId);    // Mới: Tổng nợ sale (debtType = '-')
    void createDebtNoteFromTransaction(Long customerId, BigDecimal debtAmount, String fromSource, String debtType, Long sourceId, Long storeId);
    List<DebtNoteResponseDto> findDebtNotesByCustomerIdPaged(Long customerId, int page, int size);
    Page<DebtNoteResponseDto> getDebtNotesPage(Long customerId, int page, int size);
    
    // Search method with specification (similar to ImportTransaction)
    Page<DebtNoteResponseDto> listAllDebtNotes(
            Long customerId,
            Long storeId,
            String debtType,
            String fromSource,
            Long sourceId,
            String debtDescription,
            BigDecimal minDebtAmount,
            BigDecimal maxDebtAmount,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String customerName,
            String storeName,
            Long createdBy,
            Boolean hasEvidence,
            String evidence,
            Pageable pageable
    );
}