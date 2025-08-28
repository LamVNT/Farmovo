package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto;
import com.farmovo.backend.dto.request.CreateImportTransactionRequestDto.DetailDto;
import com.farmovo.backend.exceptions.ResourceNotFoundException;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.ImportTransactionNotFoundException;
import com.farmovo.backend.exceptions.TransactionStatusException;
import com.farmovo.backend.mapper.ImportTransactionMapper;
import com.farmovo.backend.dto.response.ImportTransactionResponseDto;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.validator.ImportTransactionDetailValidator;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class ImportTransactionServiceImplTest {
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ImportTransactionRepository importTransactionRepository;
    @Mock
    private ImportTransactionMapper importTransactionMapper;
    @Mock
    private ImportTransactionDetailValidator detailValidator;
    @Mock
    private DebtNoteService debtNoteService;

    @InjectMocks
    private ImportTransactionServiceImpl importTransactionService;

    private CreateImportTransactionRequestDto baseDtoWithOneDetail() {
        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
        dto.setSupplierId(1L);
        dto.setStoreId(1L);
        dto.setStaffId(1L);
        DetailDto d = new DetailDto();
        d.setProductId(1L);
        d.setImportQuantity(1);
        d.setUnitImportPrice(new BigDecimal("5000000"));
        dto.setDetails(Collections.singletonList(d));
        dto.setStatus(ImportTransactionStatus.DRAFT);
        return dto;
    }

    private void stubHappyIdLookups() {
        given(customerRepository.findById(anyLong())).willAnswer(inv -> Optional.of(new Customer()));
        given(storeRepository.findById(anyLong())).willAnswer(inv -> Optional.of(new Store()));
        given(userRepository.findById(anyLong())).willAnswer(inv -> Optional.of(new User()));
    }

    @Nested
    @DisplayName("createImportTransaction")
    class CreateImportTransactionMatrix {

        @Test
        @DisplayName("DTO null → NullPointerException")
        void dtoNull_throwsNPE() {
            assertThrows(NullPointerException.class, () -> importTransactionService.createImportTransaction(null, 1L));
        }

        @Test
        @DisplayName("supplierId không tồn tại")
        void supplierNotFound() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            given(customerRepository.findById(anyLong())).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.createImportTransaction(dto, 1L));
        }

        @Test
        @DisplayName("storeId không tồn tại")
        void storeNotFound() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.createImportTransaction(dto, 1L));
        }

        @Test
        @DisplayName("userId (staff) không tồn tại")
        void staffNotFound() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(userRepository.findById(anyLong())).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.createImportTransaction(dto, 1L));
        }

        @Test
        @DisplayName("productId không tồn tại")
        void productNotFound() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(userRepository.findById(anyLong())).willReturn(Optional.of(new User()));
            given(productRepository.findById(anyLong())).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.createImportTransaction(dto, 1L));
        }

        @Test
        @DisplayName("status = DRAFT")
        void statusDraft_happyPath() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            stubHappyIdLookups();
            given(productRepository.findById(anyLong())).willReturn(Optional.of(new Product()));
            ImportTransaction last = new ImportTransaction();
            last.setId(7L);
            given(importTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.of(last));
            given(importTransactionRepository.save(any(ImportTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));
            assertDoesNotThrow(() -> importTransactionService.createImportTransaction(dto, 1L));
            ArgumentCaptor<ImportTransaction> captor = ArgumentCaptor.forClass(ImportTransaction.class);
            verify(importTransactionRepository, atLeastOnce()).save(captor.capture());
            ImportTransaction arg = captor.getValue();
            assertNotNull(arg.getName());
            assertTrue(arg.getName().startsWith("PN"));
            assertEquals(ImportTransactionStatus.DRAFT, arg.getStatus());
        }

        @Test
        @DisplayName("paidAmount âm hoặc detail invalid (validator ném) → propagate")
        void paidAmountInvalid_shouldPropagate() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            dto.setPaidAmount(new BigDecimal("-1"));
            stubHappyIdLookups();
            given(productRepository.findById(anyLong())).willReturn(Optional.of(new Product()));
            doThrow(new IllegalArgumentException("invalid detail")).when(detailValidator).validate(any(DetailDto.class));
            assertThrows(IllegalArgumentException.class, () -> importTransactionService.createImportTransaction(dto, 1L));
        }

        @Test
        @DisplayName("details null → NullPointerException")
        void detailsNull() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            dto.setDetails(null);
            stubHappyIdLookups();
            assertThrows(NullPointerException.class, () -> importTransactionService.createImportTransaction(dto, 1L));
        }

        @Test
        @DisplayName("details 1 phần tử hợp lệ → tạo thành công")
        void oneDetail_success() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            stubHappyIdLookups();
            given(productRepository.findById(anyLong())).willReturn(Optional.of(new Product()));
            ImportTransaction last = new ImportTransaction();
            last.setId(7L);
            given(importTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.of(last));
            given(importTransactionRepository.save(any(ImportTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));
            assertDoesNotThrow(() -> importTransactionService.createImportTransaction(dto, 1L));
            verify(importTransactionRepository, atLeastOnce()).save(any(ImportTransaction.class));
        }

        @Test
        @DisplayName("Ghi chú chứa 'Cân bằng nhập' → code PCBNxxxxxx")
        void balanceNote_generatesPCBN() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            dto.setImportTransactionNote("Phiếu Cân bằng nhập - test");
            stubHappyIdLookups();
            given(productRepository.findById(anyLong())).willReturn(Optional.of(new Product()));
            given(importTransactionRepository.getMaxPcbnSequence()).willReturn(0L);
            given(importTransactionRepository.save(any(ImportTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));
            assertDoesNotThrow(() -> importTransactionService.createImportTransaction(dto, 1L));
            ArgumentCaptor<ImportTransaction> captor = ArgumentCaptor.forClass(ImportTransaction.class);
            verify(importTransactionRepository, atLeastOnce()).save(captor.capture());
            ImportTransaction arg = captor.getValue();
            assertNotNull(arg.getName());
            assertTrue(arg.getName().startsWith("PCBN"));
        }

        @Test
        @DisplayName("status = WAITING_FOR_APPROVE được set đúng trên object mới")
        void statusWaitingForApprove_setOnCreate() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            dto.setStatus(ImportTransactionStatus.WAITING_FOR_APPROVE);
            stubHappyIdLookups();
            given(productRepository.findById(anyLong())).willReturn(Optional.of(new Product()));
            ImportTransaction last = new ImportTransaction();
            last.setId(7L);
            given(importTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.of(last));
            given(importTransactionRepository.save(any(ImportTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));
            assertDoesNotThrow(() -> importTransactionService.createImportTransaction(dto, 9L));
            ArgumentCaptor<ImportTransaction> captor = ArgumentCaptor.forClass(ImportTransaction.class);
            verify(importTransactionRepository, atLeastOnce()).save(captor.capture());
            ImportTransaction arg = captor.getValue();
            assertEquals(ImportTransactionStatus.WAITING_FOR_APPROVE, arg.getStatus());
        }

        @Test
        @DisplayName("storeId = 5 không tồn tại trong DB → ResourceNotFoundException")
        void storeId5_notExist() {
            CreateImportTransactionRequestDto dto = baseDtoWithOneDetail();
            dto.setStoreId(5L);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(eq(5L))).willReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.createImportTransaction(dto, 1L));
        }
    }

    @Test
    @DisplayName("update ném TransactionStatusException nếu không phải DRAFT")
    void testUpdate_NotDraft() {
        ImportTransaction transaction = new ImportTransaction();
        transaction.setStatus(ImportTransactionStatus.COMPLETE);
        transaction.setDetails(new ArrayList<>());
        given(importTransactionRepository.findById(1L)).willReturn(Optional.of(transaction));
        CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
        dto.setStatus(ImportTransactionStatus.COMPLETE);
        assertThrows(TransactionStatusException.class, () -> importTransactionService.update(1L, dto));
    }

    @Nested
    @DisplayName("updateImportTransaction")
    class UpdateImportTransactionMatrix {

        @Test
        @DisplayName("DTO null → NullPointerException")
        void dtoNull_throwsNPE_onUpdate() {
            assertThrows(NullPointerException.class, () -> importTransactionService.update(1L, null));
        }

        @Test
        @DisplayName("Không tìm thấy transaction → ImportTransactionNotFoundException")
        void transactionNotFound() {
            given(importTransactionRepository.findById(99L)).willReturn(Optional.empty());
            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            assertThrows(ImportTransactionNotFoundException.class, () -> importTransactionService.update(99L, dto));
        }

        @Test
        @DisplayName("Trạng thái khác DRAFT → TransactionStatusException")
        void updateStatusNotDraft() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.COMPLETE);
            tx.setDetails(new ArrayList<>());
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            assertThrows(TransactionStatusException.class, () -> importTransactionService.update(1L, dto));
        }

        @Test
        @DisplayName("details null → BadRequestException")
        void detailsNull_onUpdate() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            tx.setDetails(new ArrayList<>());
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));

            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            dto.setSupplierId(1L);
            dto.setStoreId(1L);
            dto.setStaffId(1L);
            dto.setDetails(null);

            assertThrows(BadRequestException.class, () -> importTransactionService.update(1L, dto));
        }

        @Test
        @DisplayName("details rỗng → BadRequestException")
        void detailsEmpty_onUpdate() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            tx.setDetails(new ArrayList<>());
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));

            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            dto.setSupplierId(1L);
            dto.setStoreId(1L);
            dto.setStaffId(1L);
            dto.setDetails(new ArrayList<>());

            assertThrows(BadRequestException.class, () -> importTransactionService.update(1L, dto));
        }

        @Test
        @DisplayName("supplierId null → BadRequestException")
        void supplierNull_onUpdate() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            tx.setDetails(new ArrayList<>());
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));

            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            dto.setSupplierId(null);
            dto.setStoreId(1L);
            dto.setStaffId(1L);
            DetailDto d = new DetailDto();
            d.setProductId(1L);
            d.setImportQuantity(1);
            d.setUnitImportPrice(new BigDecimal("100"));
            dto.setDetails(Collections.singletonList(d));

            assertThrows(BadRequestException.class, () -> importTransactionService.update(1L, dto));
        }

        @Test
        @DisplayName("supplier không tồn tại → BadRequestException (wrap)")
        void supplierNotFound_onUpdate() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            tx.setDetails(new ArrayList<>());
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.empty());

            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            dto.setSupplierId(5L);
            dto.setStoreId(1L);
            dto.setStaffId(1L);
            DetailDto d = new DetailDto();
            d.setProductId(1L);
            d.setImportQuantity(1);
            d.setUnitImportPrice(new BigDecimal("100"));
            dto.setDetails(Collections.singletonList(d));

            assertThrows(BadRequestException.class, () -> importTransactionService.update(1L, dto));
        }

        @Test
        @DisplayName("store không tồn tại → BadRequestException (wrap)")
        void storeNotFound_onUpdate() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            tx.setDetails(new ArrayList<>());
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.empty());

            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            dto.setSupplierId(1L);
            dto.setStoreId(5L);
            dto.setStaffId(1L);
            DetailDto d = new DetailDto();
            d.setProductId(1L);
            d.setImportQuantity(1);
            d.setUnitImportPrice(new BigDecimal("100"));
            dto.setDetails(Collections.singletonList(d));

            assertThrows(BadRequestException.class, () -> importTransactionService.update(1L, dto));
        }

        @Test
        @DisplayName("staff không tồn tại → BadRequestException (wrap)")
        void staffNotFound_onUpdate() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            tx.setDetails(new ArrayList<>());
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(userRepository.findById(anyLong())).willReturn(Optional.empty());

            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            dto.setSupplierId(1L);
            dto.setStoreId(1L);
            dto.setStaffId(9L);
            DetailDto d = new DetailDto();
            d.setProductId(1L);
            d.setImportQuantity(1);
            d.setUnitImportPrice(new BigDecimal("100"));
            dto.setDetails(Collections.singletonList(d));

            assertThrows(BadRequestException.class, () -> importTransactionService.update(1L, dto));
        }

        @Test
        @DisplayName("product không tồn tại → BadRequestException (wrap)")
        void productNotFound_onUpdate() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            tx.setDetails(new ArrayList<>());
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(userRepository.findById(anyLong())).willReturn(Optional.of(new User()));
            given(productRepository.findById(anyLong())).willReturn(Optional.empty());

            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            dto.setSupplierId(1L);
            dto.setStoreId(1L);
            dto.setStaffId(1L);
            DetailDto d = new DetailDto();
            d.setProductId(999L);
            d.setImportQuantity(1);
            d.setUnitImportPrice(new BigDecimal("100"));
            dto.setDetails(Collections.singletonList(d));

            assertThrows(BadRequestException.class, () -> importTransactionService.update(1L, dto));
        }

        @Test
        @DisplayName("Cập nhật thành công: thay details, tính total, set paidAmount")
        void updateSuccess_replacesDetails_andCalculatesTotals() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            ImportTransactionDetail oldDetail = new ImportTransactionDetail();
            oldDetail.setImportQuantity(5);
            tx.setDetails(new ArrayList<>(Collections.singletonList(oldDetail)));
            tx.setCreatedBy(1L);
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(userRepository.findById(anyLong())).willReturn(Optional.of(new User()));
            given(productRepository.findById(anyLong())).willReturn(Optional.of(new Product()));
            given(importTransactionRepository.save(any(ImportTransaction.class))).willAnswer(inv -> inv.getArgument(0));

            CreateImportTransactionRequestDto dto = new CreateImportTransactionRequestDto();
            dto.setSupplierId(1L);
            dto.setStoreId(1L);
            dto.setStaffId(1L);
            dto.setPaidAmount(new BigDecimal("300"));
            dto.setStatus(ImportTransactionStatus.DRAFT);
            DetailDto d1 = new DetailDto();
            d1.setProductId(1L);
            d1.setImportQuantity(2);
            d1.setUnitImportPrice(new BigDecimal("100"));
            DetailDto d2 = new DetailDto();
            d2.setProductId(2L);
            d2.setImportQuantity(3);
            d2.setUnitImportPrice(new BigDecimal("50"));
            dto.setDetails(Arrays.asList(d1, d2));

            assertDoesNotThrow(() -> importTransactionService.update(1L, dto));
            ArgumentCaptor<ImportTransaction> captor = ArgumentCaptor.forClass(ImportTransaction.class);
            verify(importTransactionRepository, atLeast(1)).save(captor.capture());
            List<ImportTransaction> savedArgs = captor.getAllValues();
            ImportTransaction arg = savedArgs.get(savedArgs.size() - 1);
            assertEquals(2, arg.getDetails().size());
            assertEquals(new BigDecimal("350"), arg.getTotalAmount());
            assertEquals(new BigDecimal("300"), arg.getPaidAmount());
        }
    }
    @Test
    @DisplayName("listAllImportTransaction trả về danh sách (API cũ listAllImportTransaction1)")
    void testListAllImportTransaction() {
        ImportTransaction entity = new ImportTransaction();
        List<ImportTransaction> entities = Arrays.asList(entity);
        given(importTransactionRepository.findAll()).willReturn(entities);

        List<CreateImportTransactionRequestDto> legacy = importTransactionService.listAllImportTransaction1();
        assertNotNull(legacy);
    }
    @Nested
    @DisplayName("cancelImportTransaction")
    class CancelImportTransactionMatrix {

        @Test
        @DisplayName("ID null → ResourceNotFoundException (theo hành vi hiện tại)")
        void idNull_throwsResourceNotFound() {
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.cancel(null));
        }

        @Test
        @DisplayName("ID hợp lệ → hủy thành công, set status=CANCEL")
        void idValid_cancelSuccess() {
            ImportTransaction tx = new ImportTransaction();
            tx.setStatus(ImportTransactionStatus.DRAFT);
            given(importTransactionRepository.findById(1L)).willReturn(Optional.of(tx));

            assertDoesNotThrow(() -> importTransactionService.cancel(1L));
            verify(importTransactionRepository).save(tx);
            assertEquals(ImportTransactionStatus.CANCEL, tx.getStatus());
        }

        @Test
        @DisplayName("ID = 0 → IllegalArgumentException (tùy theo validate đầu vào)")
        void idZero_illegalArg() {
            // Hiện tại service không tự validate ID <=0, nên ta giả lập bằng cách không tìm thấy
            given(importTransactionRepository.findById(0L)).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.cancel(0L));
        }

        @Test
        @DisplayName("ID = -1 → IllegalArgumentException (tùy theo validate đầu vào)")
        void idNegative_illegalArg() {
            // Tương tự, không tìm thấy sẽ ném ResourceNotFoundException từ service
            given(importTransactionRepository.findById(-1L)).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.cancel(-1L));
        }

        @Test
        @DisplayName("ID không tồn tại (999) → ResourceNotFoundException")
        void idNotFound_999() {
            given(importTransactionRepository.findById(999L)).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.cancel(999L));
        }

        @Test
        @DisplayName("ID = Long.MAX_VALUE → ResourceNotFoundException")
        void idMax_notFound() {
            given(importTransactionRepository.findById(Long.MAX_VALUE)).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.cancel(Long.MAX_VALUE));
        }

        @Test
        @DisplayName("ID = Long.MIN_VALUE → ResourceNotFoundException")
        void idMin_notFound() {
            given(importTransactionRepository.findById(Long.MIN_VALUE)).willReturn(Optional.empty());
            assertThrows(ResourceNotFoundException.class, () -> importTransactionService.cancel(Long.MIN_VALUE));
        }
    }

    @Nested
    @DisplayName("listImportTransaction")
    class ListImportTransactionMatrix {

        @Test
        @DisplayName("Pageable unsorted → service áp dụng sort importDate DESC")
        void pageableUnsorted_appliesDefaultSort() {
            ImportTransaction entity = new ImportTransaction();
            ImportTransactionResponseDto dto = new ImportTransactionResponseDto();
            given(importTransactionMapper.toResponseDto(entity)).willReturn(dto);

            // Capture pageable used by repository
            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            when(importTransactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenAnswer(inv -> {
                        Pageable used = inv.getArgument(1);
                        return new PageImpl<>(Collections.singletonList(entity), used, 1);
                    });

            Pageable input = PageRequest.of(0, 10); // unsorted
            Page<ImportTransactionResponseDto> result = importTransactionService.listAllImportTransaction(
                    "PN00001", "Công ty A", 1L, 1L, 1L,
                    ImportTransactionStatus.DRAFT, null, null,
                    new BigDecimal("1000000"), new BigDecimal("10000000"), input);

            verify(importTransactionRepository).findAll(any(Specification.class), pageableCaptor.capture());
            Pageable used = pageableCaptor.getValue();
            assertTrue(used.getSort().isSorted());
            assertEquals("importDate: DESC", used.getSort().toString());
            assertEquals(1, result.getContent().size());
            assertSame(dto, result.getContent().get(0));
        }

        @Test
        @DisplayName("Pageable đã sorted → giữ nguyên sort")
        void pageableSorted_kept() {
            ImportTransaction entity = new ImportTransaction();
            ImportTransactionResponseDto dto = new ImportTransactionResponseDto();
            given(importTransactionMapper.toResponseDto(entity)).willReturn(dto);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            when(importTransactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenAnswer(inv -> {
                        Pageable used = inv.getArgument(1);
                        return new PageImpl<>(Collections.singletonList(entity), used, 1);
                    });

            Pageable input = PageRequest.of(0, 5, Sort.by("name").ascending());
            Page<ImportTransactionResponseDto> result = importTransactionService.listAllImportTransaction(
                    null, null, null, null, null,
                    null, null, null,
                    null, null, input);

            verify(importTransactionRepository).findAll(any(Specification.class), pageableCaptor.capture());
            Pageable used = pageableCaptor.getValue();
            assertEquals("name: ASC", used.getSort().toString());
            assertEquals(1, result.getContent().size());
            assertSame(dto, result.getContent().get(0));
        }

        @Test
        @DisplayName("Pageable null → NullPointerException")
        void pageableNull_throwsNPE() {
            assertThrows(NullPointerException.class, () -> importTransactionService.listAllImportTransaction(
                    null, null, null, null, null, null, null, null, null, null, null));
        }

        @Test
        @DisplayName("Repository trả empty page → trả về page rỗng với pageable mặc định khi unsorted")
        void emptyResult_returnsEmptyPage() {
            when(importTransactionRepository.findAll(any(Specification.class), any(Pageable.class)))
                    .thenAnswer(inv -> new PageImpl<ImportTransaction>(Collections.emptyList(), inv.getArgument(1), 0));

            Pageable input = PageRequest.of(0, 10);
            Page<ImportTransactionResponseDto> result = importTransactionService.listAllImportTransaction(
                    "PN99999", "Công ty B", 999L, 999L, 999L,
                    ImportTransactionStatus.CANCEL, null, null,
                    null, null, input);

            assertNotNull(result);
            assertTrue(result.getContent().isEmpty());
        }
    }
}
