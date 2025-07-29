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
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.farmovo.backend.dto.response.CustomerResponseDto;
import com.farmovo.backend.mapper.DebtNoteMapper;

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

    @Mock
    private com.farmovo.backend.mapper.DebtNoteMapper debtNoteMapper;

    @InjectMocks
    private DebtNoteServiceImpl debtNoteService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        // Default lenient stub for mapper to avoid NPE in tests not asserting mapper
        org.mockito.Mockito.lenient()
                .when(debtNoteMapper.toResponseDto(org.mockito.ArgumentMatchers.any(DebtNote.class)))
                .thenAnswer(invocation -> {
                    DebtNote dn = invocation.getArgument(0);
                    com.farmovo.backend.dto.response.DebtNoteResponseDto dto = new com.farmovo.backend.dto.response.DebtNoteResponseDto();
                    dto.setId(dn.getId());
                    dto.setCustomerId(dn.getCustomer() != null ? dn.getCustomer().getId() : null);
                    dto.setDebtAmount(dn.getDebtAmount());
                    dto.setDebtDate(dn.getDebtDate());
                    dto.setDebtType(dn.getDebtType());
                    dto.setDebtDescription(dn.getDebtDescription());
                    return dto;
                });
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
        when(debtNoteRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(notes);
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
        when(debtNoteRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
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
        when(debtNoteRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
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

    // --- BỔ SUNG TEST CASE ĐẶC BIỆT CHO addDebtNote ---
    @Test
    @DisplayName("addDebtNote - customerId null")
    void testAddDebtNote_CustomerIdNull() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(null, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Customer ID không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("addDebtNote - debtAmount null")
    void testAddDebtNote_DebtAmountNull() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, null, LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Số tiền nợ (debtAmount) phải khác 0.", ex.getMessage());
    }

    @Test
    @DisplayName("addDebtNote - debtAmount = 0")
    void testAddDebtNote_DebtAmountZero() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, BigDecimal.ZERO, LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Số tiền nợ (debtAmount) phải khác 0.", ex.getMessage());
    }

    @Test
    @DisplayName("addDebtNote - debtDate null")
    void testAddDebtNote_DebtDateNull() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("100"), null, 1L, "+", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Ngày nợ (debtDate) không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("addDebtNote - debtType null")
    void testAddDebtNote_DebtTypeNull() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("100"), LocalDateTime.now(), 1L, null, "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Loại nợ (debtType) phải là '+' (tăng nợ) hoặc '-' (giảm nợ).", ex.getMessage());
    }

    @Test
    @DisplayName("addDebtNote - debtType invalid")
    void testAddDebtNote_DebtTypeInvalid2() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(
                1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "x", "desc", "evidence", "source", 2L
        );
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Loại nợ (debtType) phải là '+' (tăng nợ) hoặc '-' (giảm nợ).", ex.getMessage());
    }

    @Test
    @DisplayName("addDebtNote - debtDescription null")
    void testAddDebtNote_DescriptionNull() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", null, "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Mô tả không được thiếu.", ex.getMessage());
    }

    @Test
    @DisplayName("addDebtNote - customer not found")
    void testAddDebtNote_CustomerNotFound() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(99L, new BigDecimal("100"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        when(customerRepository.findById(99L)).thenReturn(Optional.empty());
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertTrue(ex.getMessage().contains("Customer not found with ID:"));
    }

    // --- UNIT TEST CASES THEO UTCID ---
    @Test
    @DisplayName("UTCID1 - customerId=1, debtAmount=1000, debtDate=now, debtType='+', debtDescription='desc' (Pass)")
    void testAddDebtNote_UTCID1() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenAnswer(invocation -> {
            DebtNote note = invocation.getArgument(0);
            note.setId(10L);
            return note;
        });
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("1000"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(BigDecimal.ZERO);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        DebtNoteResponseDto result = debtNoteService.addDebtNote(requestDto);
        assertNotNull(result);
        assertEquals(1L, result.getCustomerId());
    }

    @Test
    @DisplayName("UTCID2 - customerId=null (Fail)")
    void testAddDebtNote_UTCID2() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(null, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Customer ID không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("UTCID3 - debtAmount=0 (Fail)")
    void testAddDebtNote_UTCID3() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, BigDecimal.ZERO, LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Số tiền nợ (debtAmount) phải khác 0.", ex.getMessage());
    }

    @Test
    @DisplayName("UTCID4 - debtAmount=-100 (Pass)")
    void testAddDebtNote_UTCID4() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("-100"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenAnswer(invocation -> {
            DebtNote note = invocation.getArgument(0);
            note.setId(11L);
            return note;
        });
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("100"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(BigDecimal.ZERO);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        DebtNoteResponseDto result = debtNoteService.addDebtNote(requestDto);
        assertNotNull(result);
        assertEquals(1L, result.getCustomerId());
        assertEquals(new BigDecimal("100"), result.getDebtAmount()); // abs()
    }

    @Test
    @DisplayName("UTCID5 - debtAmount=null (Fail)")
    void testAddDebtNote_UTCID5() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, null, LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Số tiền nợ (debtAmount) phải khác 0.", ex.getMessage());
    }

    @Test
    @DisplayName("UTCID6 - debtDate=null (Fail)")
    void testAddDebtNote_UTCID6() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), null, 1L, "+", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Ngày nợ (debtDate) không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("UTCID7 - debtType=null (Fail)")
    void testAddDebtNote_UTCID7() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, null, "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Loại nợ (debtType) phải là '+' (tăng nợ) hoặc '-' (giảm nợ).", ex.getMessage());
    }

    @Test
    @DisplayName("UTCID8 - debtType='x' (Fail)")
    void testAddDebtNote_UTCID8() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "x", "desc", "", "manual", 2L);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Loại nợ (debtType) phải là '+' (tăng nợ) hoặc '-' (giảm nợ).", ex.getMessage());
    }

    @Test
    @DisplayName("UTCID9 - debtDescription=null (Fail)")
    void testAddDebtNote_UTCID9() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", null, "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Mô tả không được thiếu.", ex.getMessage());
    }

    @Test
    @DisplayName("UTCID10 - debtDescription='' (Pass)")
    void testAddDebtNote_UTCID10() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "", "", "manual", 2L);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenAnswer(invocation -> {
            DebtNote note = invocation.getArgument(0);
            note.setId(12L);
            return note;
        });
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("1000"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(BigDecimal.ZERO);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        DebtNoteResponseDto result = debtNoteService.addDebtNote(requestDto);
        assertNotNull(result);
        assertEquals(1L, result.getCustomerId());
    }

    @Test
    @DisplayName("UTCID11 - customerId=9999 (Fail)")
    void testAddDebtNote_UTCID11() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(9999L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        when(customerRepository.findById(9999L)).thenReturn(Optional.empty());
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertTrue(ex.getMessage().contains("Customer not found with ID:"));
    }

    @Test
    @DisplayName("UTCID12 - customerId=-1 (Fail)")
    void testAddDebtNote_UTCID12() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(-1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        when(customerRepository.findById(-1L)).thenReturn(Optional.empty());
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertTrue(ex.getMessage().contains("Customer not found with ID:"));
    }

    @Test
    @DisplayName("UTCID13 - debtType='' (Fail)")
    void testAddDebtNote_UTCID13() {
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "", "desc", "", "manual", 2L);
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.addDebtNote(requestDto));
        assertEquals("Loại nợ (debtType) phải là '+' (tăng nợ) hoặc '-' (giảm nợ).", ex.getMessage());
    }

    @Test
    @DisplayName("UTCID14 - debtDescription rất dài (Pass)")
    void testAddDebtNote_UTCID14() {
        String longDesc = "a".repeat(1001);
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", longDesc, "", "manual", 2L);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenAnswer(invocation -> {
            DebtNote note = invocation.getArgument(0);
            note.setId(13L);
            return note;
        });
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("1000"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(BigDecimal.ZERO);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        DebtNoteResponseDto result = debtNoteService.addDebtNote(requestDto);
        assertNotNull(result);
        assertEquals(1L, result.getCustomerId());
        assertEquals(longDesc, result.getDebtDescription());
    }

    // --- UNIT TEST CASES THEO UTCID CHO CÁC METHOD CHÍNH ---
    // updateDebtNote
    @Test
    @DisplayName("UUPD1 - updateDebtNote: all valid (Pass)")
    void testUpdateDebtNote_UUPD1() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDeletedAt(null);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenReturn(debtNote);
        DebtNoteResponseDto result = debtNoteService.updateDebtNote(debtId, requestDto);
        assertNotNull(result);
        assertEquals(debtId, result.getId());
    }

    @Test
    @DisplayName("UUPD2 - updateDebtNote: customerId null (Fail)")
    void testUpdateDebtNote_UUPD2() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(null, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDeletedAt(null);
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.updateDebtNote(debtId, requestDto));
        assertEquals("Customer ID không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("UUPD3 - updateDebtNote: debtAmount null (Pass - không validate)")
    void testUpdateDebtNote_UUPD3() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, null, LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDeletedAt(null);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenReturn(debtNote);
        DebtNoteResponseDto result = debtNoteService.updateDebtNote(debtId, requestDto);
        assertNotNull(result);
        assertEquals(debtId, result.getId());
    }

    @Test
    @DisplayName("UUPD4 - updateDebtNote: debtDate null (Pass - giữ nguyên)")
    void testUpdateDebtNote_UUPD4() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), null, 1L, "+", "desc", "", "manual", 2L);
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDebtDate(LocalDateTime.of(2023, 1, 1, 0, 0));
        debtNote.setDeletedAt(null);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenReturn(debtNote);
        DebtNoteResponseDto result = debtNoteService.updateDebtNote(debtId, requestDto);
        assertNotNull(result);
        assertEquals(debtId, result.getId());
    }

    @Test
    @DisplayName("UUPD5 - updateDebtNote: debtType invalid (Fail)")
    void testUpdateDebtNote_UUPD5() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "x", "desc", "", "manual", 2L);
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDeletedAt(null);
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.updateDebtNote(debtId, requestDto));
        assertEquals("Debt type must be '+' (import) or '-' (sale)", ex.getMessage());
    }

    @Test
    @DisplayName("UUPD6 - updateDebtNote: debtDescription null (Pass - giữ nguyên)")
    void testUpdateDebtNote_UUPD6() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", null, "", "manual", 2L);
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDebtDescription("old desc");
        debtNote.setDeletedAt(null);
        Customer customer = new Customer();
        customer.setId(1L);
        customer.setDebtNotes(new ArrayList<>());
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(debtNoteRepository.save(any(DebtNote.class))).thenReturn(debtNote);
        DebtNoteResponseDto result = debtNoteService.updateDebtNote(debtId, requestDto);
        assertNotNull(result);
        assertEquals(debtId, result.getId());
    }

    @Test
    @DisplayName("UUPD7 - updateDebtNote: debtNote not found (Fail)")
    void testUpdateDebtNote_UUPD7() {
        Long debtId = 99L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.empty());
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.updateDebtNote(debtId, requestDto));
        assertEquals("Debt note not found with ID: 99", ex.getMessage());
    }

    @Test
    @DisplayName("UUPD8 - updateDebtNote: deleted debtNote (Fail)")
    void testUpdateDebtNote_UUPD8() {
        Long debtId = 10L;
        DebtNoteRequestDto requestDto = new DebtNoteRequestDto(1L, new BigDecimal("1000"), LocalDateTime.now(), 1L, "+", "desc", "", "manual", 2L);
        DebtNote debtNote = new DebtNote();
        debtNote.setId(debtId);
        debtNote.setDeletedAt(LocalDateTime.now());
        when(debtNoteRepository.findById(debtId)).thenReturn(Optional.of(debtNote));
        Exception ex = assertThrows(IllegalStateException.class, () -> debtNoteService.updateDebtNote(debtId, requestDto));
        assertEquals("Cannot update deleted debt note with ID: 10", ex.getMessage());
    }

    // findDebtNotesByCustomerId
    @Test
    @DisplayName("UFIND1 - findDebtNotesByCustomerId: valid (Pass)")
    void testFindDebtNotesByCustomerId_UFIND1() {
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
        when(debtNoteRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(notes);
        List<DebtNoteResponseDto> result = debtNoteService.findDebtNotesByCustomerId(customerId);
        assertEquals(1, result.size());
        assertEquals(10L, result.get(0).getId());
    }

    @Test
    @DisplayName("UFIND2 - findDebtNotesByCustomerId: customerId null (Fail)")
    void testFindDebtNotesByCustomerId_UFIND2() {
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.findDebtNotesByCustomerId(null));
        assertTrue(ex.getMessage().contains("Customer ID không được để trống."));
    }

    @Test
    @DisplayName("UFIND3 - findDebtNotesByCustomerId: customer not found (Fail)")
    void testFindDebtNotesByCustomerId_UFIND3() {
        Long customerId = 9999L;
        when(customerService.getCustomerById(customerId)).thenThrow(new IllegalArgumentException("Customer not found"));
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.findDebtNotesByCustomerId(customerId));
        assertTrue(ex.getMessage().contains("Customer not found"));
    }

    // getTotalDebtByCustomerId
    @Test
    @DisplayName("UTOT1 - getTotalDebtByCustomerId: valid (Pass)")
    void testGetTotalDebtByCustomerId_UTOT1() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("200"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(new BigDecimal("50"));
        BigDecimal total = debtNoteService.getTotalDebtByCustomerId(1L);
        assertEquals(new BigDecimal("150"), total);
    }

    @Test
    @DisplayName("UTOT2 - getTotalDebtByCustomerId: customerId null (Fail)")
    void testGetTotalDebtByCustomerId_UTOT2() {
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.getTotalDebtByCustomerId(null));
        assertEquals("Customer ID không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("UTOT3 - getTotalDebtByCustomerId: customerId not found (Fail or zero)")
    void testGetTotalDebtByCustomerId_UTOT3() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(9999L)).thenReturn(null);
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(9999L)).thenReturn(null);
        BigDecimal total = debtNoteService.getTotalDebtByCustomerId(9999L);
        assertEquals(BigDecimal.ZERO, total);
    }

    // getTotalImportDebtByCustomerId / getTotalSaleDebtByCustomerId
    @Test
    @DisplayName("UIMP1 - getTotalImportDebtByCustomerId: valid (Pass)")
    void testGetTotalImportDebtByCustomerId_UIMP1() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(1L)).thenReturn(new BigDecimal("123"));
        BigDecimal result = debtNoteService.getTotalImportDebtByCustomerId(1L);
        assertEquals(new BigDecimal("123"), result);
    }

    @Test
    @DisplayName("UIMP2 - getTotalImportDebtByCustomerId: customerId null (Fail)")
    void testGetTotalImportDebtByCustomerId_UIMP2() {
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.getTotalImportDebtByCustomerId(null));
        assertEquals("Customer ID không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("UIMP3 - getTotalImportDebtByCustomerId: customerId not found (Fail or zero)")
    void testGetTotalImportDebtByCustomerId_UIMP3() {
        when(debtNoteRepository.getTotalImportDebtByCustomerId(9999L)).thenReturn(null);
        BigDecimal result = debtNoteService.getTotalImportDebtByCustomerId(9999L);
        assertEquals(BigDecimal.ZERO, result);
    }

    @Test
    @DisplayName("USAL1 - getTotalSaleDebtByCustomerId: valid (Pass)")
    void testGetTotalSaleDebtByCustomerId_USAL1() {
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(1L)).thenReturn(new BigDecimal("321"));
        BigDecimal result = debtNoteService.getTotalSaleDebtByCustomerId(1L);
        assertEquals(new BigDecimal("321"), result);
    }

    @Test
    @DisplayName("USAL2 - getTotalSaleDebtByCustomerId: customerId null (Fail)")
    void testGetTotalSaleDebtByCustomerId_USAL2() {
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.getTotalSaleDebtByCustomerId(null));
        assertEquals("Customer ID không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("USAL3 - getTotalSaleDebtByCustomerId: customerId not found (Fail or zero)")
    void testGetTotalSaleDebtByCustomerId_USAL3() {
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(9999L)).thenReturn(null);
        BigDecimal result = debtNoteService.getTotalSaleDebtByCustomerId(9999L);
        assertEquals(BigDecimal.ZERO, result);
    }

    // createDebtNoteFromTransaction
    @Test
    @DisplayName("UTRX1 - createDebtNoteFromTransaction: valid (Pass)")
    void testCreateDebtNoteFromTransaction_UTRX1() {
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
        when(debtNoteRepository.getTotalImportDebtByCustomerId(customerId)).thenReturn(new BigDecimal("1000"));
        when(debtNoteRepository.getTotalSaleDebtByCustomerId(customerId)).thenReturn(BigDecimal.ZERO);
        when(customerRepository.save(any(Customer.class))).thenReturn(customer);
        assertDoesNotThrow(() -> debtNoteService.createDebtNoteFromTransaction(customerId, new BigDecimal("1000"), "import", "+", 3L, storeId));
    }

    @Test
    @DisplayName("UTRX2 - createDebtNoteFromTransaction: customerId null (Fail)")
    void testCreateDebtNoteFromTransaction_UTRX2() {
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.createDebtNoteFromTransaction(null, new BigDecimal("1000"), "import", "+", 3L, 1L));
        assertTrue(ex.getMessage().contains("Customer not found"));
    }

    @Test
    @DisplayName("UTRX3 - createDebtNoteFromTransaction: debtAmount null (Fail)")
    void testCreateDebtNoteFromTransaction_UTRX3() {
        Long customerId = 1L;
        Long storeId = 2L;
        Customer customer = new Customer();
        customer.setId(customerId);
        Store store = new Store();
        store.setId(storeId);
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(store));
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.createDebtNoteFromTransaction(customerId, null, "import", "+", 3L, storeId));
        assertEquals("Số tiền nợ (debtAmount) không được để trống.", ex.getMessage());
    }

    @Test
    @DisplayName("UTRX4 - createDebtNoteFromTransaction: debtType invalid (Fail)")
    void testCreateDebtNoteFromTransaction_UTRX4() {
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.createDebtNoteFromTransaction(1L, new BigDecimal("1000"), "import", "x", 3L, 1L));
        assertEquals("Debt type must be '+' (import) or '-' (sale)", ex.getMessage());
    }

    @Test
    @DisplayName("UTRX5 - createDebtNoteFromTransaction: storeId null (Fail)")
    void testCreateDebtNoteFromTransaction_UTRX5() {
        Long customerId = 1L;
        Customer customer = new Customer();
        customer.setId(customerId);
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.createDebtNoteFromTransaction(customerId, new BigDecimal("1000"), "import", "+", 3L, null));
        assertTrue(ex.getMessage().contains("Store not found with ID: null"));
    }

    @Test
    @DisplayName("UTRX6 - createDebtNoteFromTransaction: storeId not found (Fail)")
    void testCreateDebtNoteFromTransaction_UTRX6() {
        Long customerId = 1L;
        Long storeId = 9999L;
        Customer customer = new Customer();
        customer.setId(customerId);
        when(customerRepository.findById(customerId)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(storeId)).thenReturn(Optional.empty());
        Exception ex = assertThrows(IllegalArgumentException.class, () -> debtNoteService.createDebtNoteFromTransaction(customerId, new BigDecimal("1000"), "import", "+", 3L, storeId));
        assertTrue(ex.getMessage().contains("Store not found with ID: 9999"));
    }
}