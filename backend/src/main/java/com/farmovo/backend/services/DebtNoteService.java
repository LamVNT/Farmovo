package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import org.springframework.data.domain.Page;
import java.math.BigDecimal;
import java.util.List;

// Interface DebtNoteService
public interface DebtNoteService {
    List<DebtNoteResponseDto> findDebtNotesByCustomerId(Long customerId);
    DebtNoteResponseDto addDebtNote(DebtNoteRequestDto requestDto);

    BigDecimal getTotalDebtByCustomerId(Long customerId);
    void createDebtNoteFromTransaction(Long customerId, BigDecimal debtAmount, String fromSource, String debtType, Long sourceId, Long storeId);
    Page<DebtNoteResponseDto> getDebtNotesPage(Long customerId, int page, int size);

    // Renamed from searchDebtNotes to findDebtNotesByCustomerIdPaged for clarity
    Page<DebtNoteResponseDto> findDebtNotesByCustomerIdPaged(Long customerId, String fromSource, String debtType, Long storeId,
                                              java.time.LocalDateTime fromDate, java.time.LocalDateTime toDate,
                                              int page, int size);
}