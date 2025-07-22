package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.DebtNote;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.DebtNoteRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.CustomerService;
import com.farmovo.backend.utils.DebtNoteValidation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.farmovo.backend.services.impl.S3Service;

@ExtendWith(MockitoExtension.class)
class DebtNoteServiceImplTest {
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private DebtNoteRepository debtNoteRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private CustomerService customerService;
    @Mock
    private S3Service s3Service;

    @InjectMocks
    private DebtNoteServiceImpl debtNoteService;

    private Customer customer;
    private DebtNote debtNote;
    private DebtNoteRequestDto requestDto;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        customer = new Customer();
        customer.setId(1L);
        customer.setTotalDebt(BigDecimal.ZERO);
        debtNote = new DebtNote();
        debtNote.setId(1L);
        debtNote.setCustomer(customer);
        debtNote.setDebtAmount(BigDecimal.valueOf(100));
        debtNote.setDebtType("+");
        debtNote.setDebtDate(LocalDateTime.now());
        debtNote.setDebtDescription("Test");
        debtNote.setDebtEvidences("");
        debtNote.setFromSource(null);
        debtNote.setSourceId(null);
        requestDto = new DebtNoteRequestDto(1L, BigDecimal.valueOf(100), LocalDateTime.now(), null, "+", "Test", "", null, null);
    }

    @Test
    @DisplayName("addDebtNote - success")
    void testAddDebtNote_Success() {
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenAnswer(invocation -> {
            DebtNote dn = invocation.getArgument(0);
            dn.setId(1L);
            return dn;
        });
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(BigDecimal.valueOf(100));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(BigDecimal.ZERO);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        DebtNoteResponseDto response = debtNoteService.addDebtNote(requestDto);
        assertNotNull(response);
        assertEquals(1L, response.getCustomerId());
        assertEquals(BigDecimal.valueOf(100), response.getDebtAmount());
        assertEquals("+", response.getDebtType());
    }

    @Test
    @DisplayName("getTotalDebtByCustomerId - success")
    void testGetTotalDebtByCustomerId() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(BigDecimal.valueOf(200));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(BigDecimal.valueOf(50));
        BigDecimal total = debtNoteService.getTotalDebtByCustomerId(1L);
        assertEquals(BigDecimal.valueOf(150), total);
    }

    @Test
    @DisplayName("updateDebtNote - success")
    void testUpdateDebtNote_Success() {
        debtNote.setDeletedAt(null);
        when(debtNoteRepository.findById(1L)).thenReturn(Optional.of(debtNote));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenAnswer(invocation -> invocation.getArgument(0));
        DebtNoteRequestDto updateDto = new DebtNoteRequestDto(1L, BigDecimal.valueOf(200), LocalDateTime.now(), null, "+", "Updated", "", null, null);
        DebtNoteResponseDto response = debtNoteService.updateDebtNote(1L, updateDto);
        assertNotNull(response);
        assertEquals(1L, response.getCustomerId());
        assertEquals("+", response.getDebtType());
        assertEquals("Updated", response.getDebtDescription());
    }
}