package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.DebtNoteRequestDto;
import com.farmovo.backend.dto.response.DebtNoteResponseDto;
import com.farmovo.backend.models.Customer;
import com.farmovo.backend.models.DebtNote;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.DebtNoteRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.CustomerService;
import com.farmovo.backend.services.impl.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.farmovo.backend.dto.response.CustomerResponseDto;

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

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    @DisplayName("findDebtNotesByCustomerId - success")
    void testFindDebtNotesByCustomerId_Success() {
        Long customerId = 1L;
        CustomerResponseDto customerResponseDto = new CustomerResponseDto();
        customerResponseDto.setId(customerId);
        Customer customer = new Customer();
        customer.setId(customerId);
        DebtNote note = new DebtNote();
        note.setId(10L);
        note.setCustomer(customer);
        note.setDebtAmount(new BigDecimal("100"));
        note.setDebtDate(LocalDateTime.now());
        note.setDebtType("+");
        note.setDebtDescription("desc");
        note.setDebtEvidences("");
        note.setFromSource("");
        note.setSourceId(2L);
        note.setStore(null);
        note.setCreatedAt(LocalDateTime.now());
        note.setCreatedBy(1L);
        note.setUpdatedAt(null);
        note.setDeletedAt(null);
        note.setDeletedBy(null);
        List<DebtNote> notes = List.of(note);
        when(customerService.getCustomerById(customerId)).thenReturn(customerResponseDto);
        when(debtNoteRepository.findAll()).thenReturn(notes);
        List<DebtNoteResponseDto> result = debtNoteService.findDebtNotesByCustomerId(customerId);
        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).getId());
    }

    @Test
    @DisplayName("findDebtNotesByCustomerId - customer not found")
    void testFindDebtNotesByCustomerId_CustomerNotFound() {
        Long customerId = 1L;
        when(customerService.getCustomerById(customerId)).thenThrow(new IllegalArgumentException("Customer not found"));
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.findDebtNotesByCustomerId(customerId));
    }

    @Test
    @DisplayName("findDebtNotesByCustomerIdPaged - success")
    void testFindDebtNotesByCustomerIdPaged_Success() {
        Long customerId = 1L;
        DebtNote note = new DebtNote();
        note.setId(1L);
        note.setCustomer(new Customer());
        note.setDebtAmount(new BigDecimal("100"));
        note.setDebtDate(LocalDateTime.now());
        note.setDebtType("+");
        note.setDebtDescription("desc");
        List<DebtNote> notes = List.of(note);
        Page<DebtNote> page = new PageImpl<>(notes);
        when(debtNoteRepository.findByCustomerIdAndDeletedAtIsNull(eq(customerId), any(Pageable.class))).thenReturn(page);
        List<DebtNoteResponseDto> result = debtNoteService.findDebtNotesByCustomerIdPaged(customerId, 0, 10);
        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    @DisplayName("getDebtNotesPage - success")
    void testGetDebtNotesPage_Success() {
        Long customerId = 1L;
        DebtNote note = new DebtNote();
        note.setId(1L);
        note.setCustomer(new Customer());
        note.setDebtAmount(new BigDecimal("100"));
        note.setDebtDate(LocalDateTime.now());
        note.setDebtType("+");
        note.setDebtDescription("desc");
        List<DebtNote> notes = List.of(note);
        Page<DebtNote> page = new PageImpl<>(notes);
        when(debtNoteRepository.findByCustomerIdAndDeletedAtIsNull(eq(customerId), any(Pageable.class))).thenReturn(page);
        Page<DebtNoteResponseDto> result = debtNoteService.getDebtNotesPage(customerId, 0, 10);
        assertEquals(1, result.getTotalElements());
        assertEquals(1L, result.getContent().get(0).getId());
    }

    @Test
    @DisplayName("addDebtNote - success")
    void testAddDebtNote_Success() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(
                1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "evidence", "source", 2L
        );
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>()); // Fix NPE
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenAnswer(invocation -> {
            DebtNote note = invocation.getArgument(0);
            note.setId(10L);
            return note;
        });
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("100"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(BigDecimal.ZERO);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        DebtNoteResponseDto result = debtNoteService.addDebtNote(requestDto);
        assertNotNull(result);
        assertEquals(1L, result.getCustomerId());
        assertEquals(new BigDecimal("100"), result.getDebtAmount());
        verify(debtNoteRepository).save(any(DebtNote.class));
        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    @DisplayName("addDebtNote - invalid debtType")
    void testAddDebtNote_InvalidDebtType() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(
                1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "x", "desc", "evidence", "source", 2L
        );
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
    }

    @Test
    @DisplayName("updateDebtNote - success")
    void testUpdateDebtNote_Success() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(
                1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "evidence", "source", 2L
        );
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDeletedAt(null);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>()); // Fix NPE
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenReturn(debtNote);
        DebtNoteResponseDto result = debtNoteService.updateDebtNote(debtId, requestDto);
        assertNotNull(result);
        assertEquals(debtId, result.getId());
    }

    @Test
    @DisplayName("updateDebtNote - debt note not found")
    void testUpdateDebtNote_NotFound() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(
                1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "evidence", "source", 2L
        );
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.updateDebtNote(debtId, requestDto));
    }

    @Test
    @DisplayName("updateDebtNote - deleted debt note")
    void testUpdateDebtNote_Deleted() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(
                1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "evidence", "source", 2L
        );
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDeletedAt(LocalDateTime.now());
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        assertThrows(IllegalStateException.class, () -> debtNoteService.updateDebtNote(debtId, requestDto));
    }

    @Test
    @DisplayName("updateDebtNote - invalid debtType")
    void testUpdateDebtNote_InvalidDebtType() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(
                1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "x", "desc", "evidence", "source", 2L
        );
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDeletedAt(null);
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.updateDebtNote(debtId, requestDto));
    }

    @Test
    @DisplayName("getTotalDebtByCustomerId - success")
    void testGetTotalDebtByCustomerId_Success() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("200"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(new BigDecimal("50"));
        BigDecimal total = debtNoteService.getTotalDebtByCustomerId(1L);
        assertEquals(new BigDecimal("150"), total);
    }

    @Test
    @DisplayName("getTotalDebtByCustomerId - repository throws")
    void testGetTotalDebtByCustomerId_RepositoryThrows() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenThrow(new RuntimeException("fail"));
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.getTotalDebtByCustomerId(1L));
    }

    @Test
    @DisplayName("getTotalImportDebtByCustomerId - success")
    void testGetTotalImportDebtByCustomerId_Success() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("123"));
        BigDecimal result = debtNoteService.getTotalImportDebtByCustomerId(1L);
        assertEquals(new BigDecimal("123"), result);
    }

    @Test
    @DisplayName("getTotalImportDebtByCustomerId - repository throws")
    void testGetTotalImportDebtByCustomerId_RepositoryThrows() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenThrow(new RuntimeException("fail"));
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.getTotalImportDebtByCustomerId(1L));
    }

    @Test
    @DisplayName("getTotalSaleDebtByCustomerId - success")
    void testGetTotalSaleDebtByCustomerId_Success() {
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(new BigDecimal("321"));
        BigDecimal result = debtNoteService.getTotalSaleDebtByCustomerId(1L);
        assertEquals(new BigDecimal("321"), result);
    }

    @Test
    @DisplayName("getTotalSaleDebtByCustomerId - repository throws")
    void testGetTotalSaleDebtByCustomerId_RepositoryThrows() {
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenThrow(new RuntimeException("fail"));
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.getTotalSaleDebtByCustomerId(1L));
    }

    @Test
    @DisplayName("createDebtNoteFromTransaction - success")
    void testCreateDebtNoteFromTransaction_Success() {
        Long customerId = 1L;
        Long storeId = 2L;
        Customer customer = new Customer();
        customer.setId(customerId);
        Store store = new Store();
        store.setId(storeId);
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        when(debtNoteRepository.save(any(DebtNote.class))).thenAnswer(invocation -> {
            DebtNote note = invocation.getArgument(0);
            note.setId(10L);
            return note;
        });
        when(debtNoteRepository.getTotalImportDebtByCustomerId(customerId)).thenReturn(new BigDecimal("100"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(customerId)).thenReturn(BigDecimal.ZERO);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        assertDoesNotThrow(() -> debtNoteService.createDebtNoteFromTransaction(customerId, new BigDecimal("100"), "source", "+", 3L, storeId));
        verify(debtNoteRepository).save(any(DebtNote.class));
        verify(customerRepository).save(any(Customer.class));
    }

    @Test
    @DisplayName("createDebtNoteFromTransaction - invalid debtType")
    void testCreateDebtNoteFromTransaction_InvalidDebtType() {
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.createDebtNoteFromTransaction(1L, new BigDecimal("100"), "source", "x", 3L, 2L));
    }

    @Test
    @DisplayName("createDebtNoteFromTransaction - customer not found")
    void testCreateDebtNoteFromTransaction_CustomerNotFound() {
        when(customerRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.createDebtNoteFromTransaction(1L, new BigDecimal("100"), "source", "+", 3L, 2L));
    }

    @Test
    @DisplayName("createDebtNoteFromTransaction - store not found")
    void testCreateDebtNoteFromTransaction_StoreNotFound() {
        Customer customer = new Customer();
        customer.setId(1L);
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(2L)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> debtNoteService.createDebtNoteFromTransaction(1L, new BigDecimal("100"), "source", "+", 3L, 2L));
    }
}