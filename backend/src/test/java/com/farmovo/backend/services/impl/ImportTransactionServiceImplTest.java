//package com.farmovo.backend.services.impl;
//
//import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
//import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto.DetailDto;
//import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
//import com.farmovo.backend.exceptions.ResourceNotFoundException;
//import com.farmovo.backend.exceptions.ImportTransactionNotFoundException;
//import com.farmovo.backend.exceptions.TransactionStatusException;
//import com.farmovo.backend.mapper.ImportTransactionMapper;
//import com.farmovo.backend.models.*;
//import com.farmovo.backend.repositories.*;
//import com.farmovo.backend.services.DebtNoteService;
//import com.farmovo.backend.validator.ImportTransactionDetailValidator;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.DisplayName;
//import org.junit.jupiter.api.Test;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.MockitoAnnotations;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//import java.util.*;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.BDDMockito.given;
//import static org.mockito.Mockito.*;
//
//class ImportTransactionServiceImplTest {
//    @Mock
//    private ProductRepository productRepository;
//    @Mock
//    private CustomerRepository customerRepository;
//    @Mock
//    private StoreRepository storeRepository;
//    @Mock
//    private UserRepository userRepository;
//    @Mock
//    private ImportTransactionRepository importTransactionRepository;
//    @Mock
//    private ImportTransactionMapper importTransactionMapper;
//    @Mock
//    private ImportTransactionDetailValidator detailValidator;
//    @Mock
//    private DebtNoteService debtNoteService;
//
//    @InjectMocks
//    private ImportTransactionServiceImpl importTransactionService;
//
//    @BeforeEach
//    void setUp() {
//        MockitoAnnotations.openMocks(this);
//    }
//
//    @Test
//    @DisplayName("createImportTransaction thành công")
//    void testCreateImportTransaction() {
//        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
//        dto.setSupplierId(1L);
//        dto.setStoreId(2L);
//        dto.setStaffId(3L);
//        dto.setDetails(Arrays.asList(new DetailDto() {{
//            setProductId(4L);
//            setImportQuantity(2);
//            setUnitImportPrice(BigDecimal.TEN);
//        }}));
//        Customer supplier = new Customer();
//        Store store = new Store();
//        User staff = new User();
//        Product product = new Product();
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setId(100L);
//        ImportTransaction savedTransaction = new ImportTransaction();
//        savedTransaction.setId(101L);
//        savedTransaction.setDetails(new ArrayList<>());
//        given(customerRepository.findById(1L)).willReturn(Optional.of(supplier));
//        given(storeRepository.findById(2L)).willReturn(Optional.of(store));
//        given(userRepository.findById(3L)).willReturn(Optional.of(staff));
//        given(productRepository.findById(4L)).willReturn(Optional.of(product));
//        given(importTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.of(transaction));
//        given(importTransactionRepository.save(any(ImportTransaction.class))).willReturn(savedTransaction);
//
//        assertDoesNotThrow(() -> importTransactionService.createImportTransaction(dto, 10L));
//        verify(importTransactionRepository, atLeastOnce()).save(any(ImportTransaction.class));
//    }
//
//    @Test
//    @DisplayName("update thành công với trạng thái DRAFT")
//    void testUpdateDraft() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.DRAFT);
//        transaction.setDetails(new ArrayList<>());
//        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
//        dto.setSupplierId(1L);
//        dto.setStoreId(2L);
//        dto.setStaffId(3L);
//        dto.setStatus(ImportTransactionStatus.DRAFT);
//        dto.setDetails(Arrays.asList(new DetailDto() {{
//            setProductId(4L);
//            setImportQuantity(2);
//            setUnitImportPrice(BigDecimal.TEN);
//        }}));
//        Customer supplier = new Customer();
//        Store store = new Store();
//        User staff = new User();
//        Product product = new Product();
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        given(customerRepository.findById(1L)).willReturn(Optional.of(supplier));
//        given(storeRepository.findById(2L)).willReturn(Optional.of(store));
//        given(userRepository.findById(3L)).willReturn(Optional.of(staff));
//        given(productRepository.findById(4L)).willReturn(Optional.of(product));
//        given(importTransactionRepository.save(any(ImportTransaction.class))).willReturn(transaction);
//
//        assertDoesNotThrow(() -> importTransactionService.update(1L, dto));
//        verify(importTransactionRepository).save(transaction);
//    }
//
//    @Test
//    @DisplayName("update ném TransactionStatusException nếu không phải DRAFT")
//    void testUpdate_NotDraft() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.COMPLETE);
//        transaction.setDetails(new ArrayList<>());
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
//        dto.setStatus(ImportTransactionStatus.COMPLETE);
//        assertThrows(TransactionStatusException.class, () -> importTransactionService.update(1L, dto));
//    }
//
//    @Test
//    @DisplayName("cancel thành công")
//    void testCancel() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.DRAFT);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        assertDoesNotThrow(() -> importTransactionService.cancel(1L));
//        verify(importTransactionRepository).save(transaction);
//        assertEquals(ImportTransactionStatus.CANCEL, transaction.getStatus());
//    }
//
//    @Test
//    @DisplayName("open thành công với trạng thái DRAFT")
//    void testOpenDraft() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.DRAFT);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        assertDoesNotThrow(() -> importTransactionService.open(1L));
//        verify(importTransactionRepository).save(transaction);
//        assertEquals(ImportTransactionStatus.WAITING_FOR_APPROVE, transaction.getStatus());
//    }
//
//    @Test
//    @DisplayName("open ném TransactionStatusException nếu không phải DRAFT")
//    void testOpen_NotDraft() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.COMPLETE);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        assertThrows(TransactionStatusException.class, () -> importTransactionService.open(1L));
//    }
//
//    @Test
//    @DisplayName("complete thành công với trạng thái WAITING_FOR_APPROVE")
//    void testCompleteWaitingForApprove() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.WAITING_FOR_APPROVE);
//        transaction.setPaidAmount(BigDecimal.ZERO);
//        transaction.setTotalAmount(BigDecimal.TEN);
//        transaction.setDetails(new ArrayList<>());
//        Customer supplier = new Customer(); supplier.setId(1L);
//        Store store = new Store(); store.setId(2L);
//        transaction.setSupplier(supplier);
//        transaction.setStore(store);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        assertDoesNotThrow(() -> importTransactionService.complete(1L));
//        verify(importTransactionRepository).save(transaction);
//        assertEquals(ImportTransactionStatus.COMPLETE, transaction.getStatus());
//    }
//
//    @Test
//    @DisplayName("complete ném TransactionStatusException nếu không phải WAITING_FOR_APPROVE")
//    void testComplete_NotWaitingForApprove() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.DRAFT);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        assertThrows(TransactionStatusException.class, () -> importTransactionService.complete(1L));
//    }
//
//    @Test
//    @DisplayName("close thành công với trạng thái WAITING_FOR_APPROVE")
//    void testCloseWaitingForApprove() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.WAITING_FOR_APPROVE);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        assertDoesNotThrow(() -> importTransactionService.close(1L));
//        verify(importTransactionRepository).save(transaction);
//        assertEquals(ImportTransactionStatus.DRAFT, transaction.getStatus());
//    }
//
//    @Test
//    @DisplayName("close ném TransactionStatusException nếu không phải WAITING_FOR_APPROVE")
//    void testClose_NotWaitingForApprove() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setStatus(ImportTransactionStatus.DRAFT);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        assertThrows(TransactionStatusException.class, () -> importTransactionService.close(1L));
//    }
//
//    @Test
//    @DisplayName("listAllImportTransaction trả về danh sách")
//    void testListAllImportTransaction() {
//        ImportTransaction entity = new ImportTransaction();
//        List<ImportTransaction> entities = Arrays.asList(entity);
//        ImportTransactionResponseDto dto = new ImportTransactionResponseDto();
//        given(importTransactionRepository.findAllImportActive()).willReturn(entities);
//        given(importTransactionMapper.toResponseDto(entity)).willReturn(dto);
//        List<ImportTransactionResponseDto> result = importTransactionService .listAllImportTransaction();
//        assertEquals(1, result.size());
//        verify(importTransactionRepository).findAllImportActive();
//        verify(importTransactionMapper).toResponseDto(entity);
//    }
//
//    @Test
//    @DisplayName("getImportTransactionById trả về đúng dto")
//    void testGetImportTransactionById() {
//        ImportTransaction entity = new ImportTransaction();
//        entity.setId(1L);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(entity));
//        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
//        given(importTransactionMapper.toDto(entity)).willReturn(dto);
//        CreateImportTransactionRequestDto result = importTransactionService.getImportTransactionById(1L);
//        assertNotNull(result);
//        verify(importTransactionRepository).findById(1L);
//        verify(importTransactionMapper).toDto(entity);
//    }
//
//    @Test
//    @DisplayName("getNextImportTransactionCode trả về mã đúng định dạng")
//    void testGetNextImportTransactionCode() {
//        ImportTransaction last = new ImportTransaction();
//        last.setId(5L);
//        given(importTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.of(last));
//        String code = importTransactionService.getNextImportTransactionCode();
//        assertEquals("PN000006", code);
//    }
//
//    @Test
//    @DisplayName("softDeleteImportTransaction thành công")
//    void testSoftDeleteImportTransaction() {
//        ImportTransaction transaction = new ImportTransaction();
//        transaction.setId(1L);
//        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
//        given(importTransactionRepository.save(transaction)).willReturn(transaction);
//        assertDoesNotThrow(() -> importTransactionService.softDeleteImportTransaction(1L, 2L));
//        verify(importTransactionRepository).save(transaction);
//        assertNotNull(transaction.getDeletedAt());
//        assertEquals(2L, transaction.getDeletedBy());
//    }
//}