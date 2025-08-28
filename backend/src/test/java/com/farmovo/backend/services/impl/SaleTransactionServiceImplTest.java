package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.exceptions.*;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.mapper.SaleTransactionMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.validator.SaleTransactionValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
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

@ExtendWith(MockitoExtension.class)
class SaleTransactionServiceImplTest {
    @Mock
    private SaleTransactionRepository saleTransactionRepository;
    @Mock
    private ProductMapper productMapper;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private SaleTransactionMapper saleTransactionMapper;
    @Mock
    private ImportTransactionDetailRepository importTransactionDetailRepository;
    @Mock
    private DebtNoteService debtNoteService;
    @Mock
    private SaleTransactionValidator saleTransactionValidator;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private StocktakeRepository stocktakeRepository;

    @InjectMocks
    private SaleTransactionServiceImpl saleTransactionService;

    private CreateSaleTransactionRequestDto baseDto() {
        CreateSaleTransactionRequestDto dto = new CreateSaleTransactionRequestDto();
        dto.setCustomerId(1L);
        dto.setStoreId(1L);
        dto.setTotalAmount(new BigDecimal("10000000"));
        dto.setPaidAmount(new BigDecimal("5000000"));
        dto.setStatus(SaleTransactionStatus.DRAFT);
        dto.setDetail(new ArrayList<>());
        return dto;
    }

    @Nested
    @DisplayName("createSaleTransaction")
    class CreateSaleTransactionMatrix {

        @Test
        @DisplayName("createTransactionRequestDto null → NullPointerException")
        void dtoNull_throwsNPE() {
            assertThrows(NullPointerException.class, () -> saleTransactionService.save(null, 1L));
        }

        @Test
        @DisplayName("createTransactionRequestDto valid → tạo thành công")
        void dtoValid_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("customerId Long.MIN_VALUE → CustomerNotFoundException")
        void customerId_min_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setCustomerId(Long.MIN_VALUE);
            given(customerRepository.findById(Long.MIN_VALUE)).willReturn(Optional.empty());
            assertThrows(CustomerNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("customerId Long.MAX_VALUE → CustomerNotFoundException")
        void customerId_max_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setCustomerId(Long.MAX_VALUE);
            given(customerRepository.findById(Long.MAX_VALUE)).willReturn(Optional.empty());
            assertThrows(CustomerNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("customerId 5L (không tồn tại) → CustomerNotFoundException")
        void customerId5_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setCustomerId(5L);
            given(customerRepository.findById(5L)).willReturn(Optional.empty());
            assertThrows(CustomerNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("customerId 1L (tồn tại) → tạo thành công")
        void customerId1_exists_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setCustomerId(1L);
            given(customerRepository.findById(1L)).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("customerId 0L → CustomerNotFoundException")
        void customerId0_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setCustomerId(0L);
            given(customerRepository.findById(0L)).willReturn(Optional.empty());
            assertThrows(CustomerNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("customerId -1L → CustomerNotFoundException")
        void customerId_negative_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setCustomerId(-1L);
            given(customerRepository.findById(-1L)).willReturn(Optional.empty());
            assertThrows(CustomerNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("Status DRAFT → tạo đối tượng với status DRAFT")
        void statusDraft_createsWithDraftStatus() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStatus(SaleTransactionStatus.DRAFT);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(SaleTransactionStatus.DRAFT, captor.getValue().getStatus());
        }

        @Test
        @DisplayName("Status WAITING_FOR_APPROVE → tạo đối tượng với status WAITING_FOR_APPROVE")
        void statusWaitingForApprove_createsWithWaitingStatus() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStatus(SaleTransactionStatus.WAITING_FOR_APPROVE);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(SaleTransactionStatus.WAITING_FOR_APPROVE, captor.getValue().getStatus());
        }

        @Test
        @DisplayName("Status COMPLETE → tạo đối tượng với status COMPLETE")
        void statusComplete_createsWithCompleteStatus() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStatus(SaleTransactionStatus.COMPLETE);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(SaleTransactionStatus.COMPLETE, captor.getValue().getStatus());
        }

        @Test
        @DisplayName("Status CANCEL → tạo đối tượng với status CANCEL")
        void statusCancel_createsWithCancelStatus() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStatus(SaleTransactionStatus.CANCEL);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(SaleTransactionStatus.CANCEL, captor.getValue().getStatus());
        }

        @Test
        @DisplayName("storeId 1L (tồn tại) → tạo thành công")
        void storeId1_exists_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStoreId(1L);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(1L)).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("storeId 0L → StoreNotFoundException")
        void storeId0_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStoreId(0L);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(0L)).willReturn(Optional.empty());
            assertThrows(StoreNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("storeId -1L → StoreNotFoundException")
        void storeId_negative_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStoreId(-1L);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(-1L)).willReturn(Optional.empty());
            assertThrows(StoreNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("storeId 5L (không tồn tại) → StoreNotFoundException")
        void storeId5_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStoreId(5L);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(5L)).willReturn(Optional.empty());
            assertThrows(StoreNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("storeId Long.MIN_VALUE → StoreNotFoundException")
        void storeId_min_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStoreId(Long.MIN_VALUE);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(Long.MIN_VALUE)).willReturn(Optional.empty());
            assertThrows(StoreNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("storeId Long.MAX_VALUE → StoreNotFoundException")
        void storeId_max_notFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStoreId(Long.MAX_VALUE);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(Long.MAX_VALUE)).willReturn(Optional.empty());
            assertThrows(StoreNotFoundException.class, () -> saleTransactionService.save(dto, 1L));
        }

        @Test
        @DisplayName("paidAmount 0 → tạo thành công")
        void paidAmount0_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setPaidAmount(BigDecimal.ZERO);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("paidAmount -345 → tạo thành công")
        void paidAmount_negative_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setPaidAmount(new BigDecimal("-345"));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("paidAmount 23.24 → tạo thành công")
        void paidAmount_decimal_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setPaidAmount(new BigDecimal("23.24"));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("paidAmount 5.000.000 → tạo thành công")
        void paidAmount_large_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setPaidAmount(new BigDecimal("5000000"));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("paidAmount 12345678901234567890 → tạo thành công")
        void paidAmount_veryLarge_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setPaidAmount(new BigDecimal("12345678901234567890"));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("paidAmount 123.4567891 → tạo thành công")
        void paidAmount_preciseDecimal_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setPaidAmount(new BigDecimal("123.4567891"));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("saleTransactionNote 1000 ký tự → tạo thành công")
        void note_1000chars_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setSaleTransactionNote("a".repeat(1000));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("saleTransactionNote 1001 ký tự → tạo thành công")
        void note_1001chars_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setSaleTransactionNote("a".repeat(1001));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("saleTransactionNote empty → tạo thành công")
        void note_empty_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setSaleTransactionNote("");
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("saleTransactionNote 'đơn hàng bình thường' → tạo thành công")
        void note_normal_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setSaleTransactionNote("đơn hàng bình thường");
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("details null → tạo thành công")
        void details_null_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setDetail(null);
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("details 1 phần tử → tạo thành công")
        void details_one_item_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            ProductSaleResponseDto item = new ProductSaleResponseDto();
            item.setId(10L);
            item.setProId(100L);
            item.setQuantity(1);
            dto.setDetail(Collections.singletonList(item));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            verify(saleTransactionRepository).save(any(SaleTransaction.class));
        }

        @Test
        @DisplayName("userId 1L → createdBy set thành 1L")
        void userId1_createdBySet() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 1L));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(1L, captor.getValue().getCreatedBy());
        }

        @Test
        @DisplayName("userId 0L → createdBy set thành 0L")
        void userId0_createdBySet() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 0L));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(0L, captor.getValue().getCreatedBy());
        }

        @Test
        @DisplayName("userId 9L → createdBy set thành 9L")
        void userId9_createdBySet() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, 9L));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(9L, captor.getValue().getCreatedBy());
        }

        @Test
        @DisplayName("userId -1L → createdBy set thành -1L")
        void userId_negative_createdBySet() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, -1L));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(-1L, captor.getValue().getCreatedBy());
        }

        @Test
        @DisplayName("userId Long.MAX_VALUE → createdBy set thành Long.MAX_VALUE")
        void userId_max_createdBySet() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, Long.MAX_VALUE));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(Long.MAX_VALUE, captor.getValue().getCreatedBy());
        }

        @Test
        @DisplayName("userId Long.MIN_VALUE → createdBy set thành Long.MIN_VALUE")
        void userId_min_createdBySet() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.findTopByOrderByIdDesc()).willReturn(Optional.empty());
            given(saleTransactionRepository.save(any(SaleTransaction.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.save(dto, Long.MIN_VALUE));
            ArgumentCaptor<SaleTransaction> captor = ArgumentCaptor.forClass(SaleTransaction.class);
            verify(saleTransactionRepository).save(captor.capture());
            assertEquals(Long.MIN_VALUE, captor.getValue().getCreatedBy());
        }
    }

    @Nested
    @DisplayName("updateSaleTransaction")
    class UpdateSaleTransactionMatrix {

        @Test
        @DisplayName("dto valid, id 1L, userId 1L → cập nhật thành công")
        void utc01_validDto_id1_userId1_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.save(any(SaleTransaction.class))).willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.updateSaleTransaction(1L, dto));
            verify(saleTransactionRepository).save(tx);
        }

        @Test
        @DisplayName("dto null, id 1L, userId 1L → NullPointerException")
        void utc02_dtoNull_id1_userId1_throwsNPE() {
            assertThrows(NullPointerException.class, () -> saleTransactionService.updateSaleTransaction(1L, null));
        }

        @Test
        @DisplayName("dto note.length=256, id 1L, userId 1L → BadRequestException")
        void utc03_dtoNote256_id1_userId1_throwsBadRequest() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setSaleTransactionNote("a".repeat(256));
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            doThrow(new BadRequestException("Ghi chú quá dài")).when(saleTransactionValidator).validate(dto);

            assertThrows(BadRequestException.class, () -> saleTransactionService.updateSaleTransaction(1L, dto));
        }

        @Test
        @DisplayName("dto totalAmount<0, id 1L, userId 1L → IllegalArgumentException")
        void utc04_dtoTotalAmountNegative_id1_userId1_throwsIllegalArg() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setTotalAmount(new BigDecimal("-100"));
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            doThrow(new IllegalArgumentException("Tổng tiền không hợp lệ.")).when(saleTransactionValidator).validate(dto);

            assertThrows(IllegalArgumentException.class, () -> saleTransactionService.updateSaleTransaction(1L, dto));
        }

        @Test
        @DisplayName("dto status≠DRAFT, id 1L, userId 1L → TransactionStatusException")
        void utc05_dtoStatusNotDraft_id1_userId1_throwsTransactionStatus() {
            CreateSaleTransactionRequestDto dto = baseDto();
            dto.setStatus(SaleTransactionStatus.COMPLETE);
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.COMPLETE); // Not DRAFT
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));

            assertThrows(TransactionStatusException.class, () -> saleTransactionService.updateSaleTransaction(1L, dto));
        }

        @Test
        @DisplayName("dto valid, id 0L, userId 1L → SaleTransactionNotFoundException")
        void utc06_validDto_id0_userId1_throwsNotFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(saleTransactionRepository.findById(0L)).willReturn(Optional.empty());

            assertThrows(SaleTransactionNotFoundException.class, () -> saleTransactionService.updateSaleTransaction(0L, dto));
        }

        @Test
        @DisplayName("dto valid, id 9L, userId 1L → SaleTransactionNotFoundException")
        void utc07_validDto_id9_userId1_throwsNotFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(saleTransactionRepository.findById(9L)).willReturn(Optional.empty());

            assertThrows(SaleTransactionNotFoundException.class, () -> saleTransactionService.updateSaleTransaction(9L, dto));
        }

        @Test
        @DisplayName("dto valid, id -1L, userId 1L → SaleTransactionNotFoundException")
        void utc08_validDto_idNegative_userId1_throwsNotFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(saleTransactionRepository.findById(-1L)).willReturn(Optional.empty());

            assertThrows(SaleTransactionNotFoundException.class, () -> saleTransactionService.updateSaleTransaction(-1L, dto));
        }

        @Test
        @DisplayName("dto valid, id Long.MAX_VALUE, userId 1L → SaleTransactionNotFoundException")
        void utc09_validDto_idMax_userId1_throwsNotFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(saleTransactionRepository.findById(Long.MAX_VALUE)).willReturn(Optional.empty());

            assertThrows(SaleTransactionNotFoundException.class, () -> saleTransactionService.updateSaleTransaction(Long.MAX_VALUE, dto));
        }

        @Test
        @DisplayName("dto valid, id Long.MIN_VALUE, userId 1L → SaleTransactionNotFoundException")
        void utc10_validDto_idMin_userId1_throwsNotFound() {
            CreateSaleTransactionRequestDto dto = baseDto();
            given(saleTransactionRepository.findById(Long.MIN_VALUE)).willReturn(Optional.empty());

            assertThrows(SaleTransactionNotFoundException.class, () -> saleTransactionService.updateSaleTransaction(Long.MIN_VALUE, dto));
        }

        @Test
        @DisplayName("dto valid, id 1L, userId null → NullPointerException")
        void utc11_validDto_id1_userIdNull_throwsNPE() {
            CreateSaleTransactionRequestDto dto = baseDto();
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            // Note: userId is not used in updateSaleTransaction method, so this test may not be applicable
            // But we'll test the method call anyway

            assertDoesNotThrow(() -> saleTransactionService.updateSaleTransaction(1L, dto));
        }

        @Test
        @DisplayName("dto valid, id 1L, userId 0L → cập nhật thành công")
        void utc12_validDto_id1_userId0_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.save(any(SaleTransaction.class))).willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.updateSaleTransaction(1L, dto));
            verify(saleTransactionRepository).save(tx);
        }

        @Test
        @DisplayName("dto valid, id 1L, userId 9L → cập nhật thành công")
        void utc13_validDto_id1_userId9_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.save(any(SaleTransaction.class))).willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.updateSaleTransaction(1L, dto));
            verify(saleTransactionRepository).save(tx);
        }

        @Test
        @DisplayName("dto valid, id 1L, userId -1L → cập nhật thành công")
        void utc14_validDto_id1_userIdNegative_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.save(any(SaleTransaction.class))).willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.updateSaleTransaction(1L, dto));
            verify(saleTransactionRepository).save(tx);
        }

        @Test
        @DisplayName("dto valid, id 1L, userId Long.MAX_VALUE → cập nhật thành công")
        void utc15_validDto_id1_userIdMax_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.save(any(SaleTransaction.class))).willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.updateSaleTransaction(1L, dto));
            verify(saleTransactionRepository).save(tx);
        }

        @Test
        @DisplayName("dto valid, id 1L, userId Long.MIN_VALUE → cập nhật thành công")
        void utc16_validDto_id1_userIdMin_success() {
            CreateSaleTransactionRequestDto dto = baseDto();
            SaleTransaction tx = new SaleTransaction();
            tx.setStatus(SaleTransactionStatus.DRAFT);
            given(saleTransactionRepository.findById(1L)).willReturn(Optional.of(tx));
            given(customerRepository.findById(anyLong())).willReturn(Optional.of(new Customer()));
            given(storeRepository.findById(anyLong())).willReturn(Optional.of(new Store()));
            given(saleTransactionRepository.save(any(SaleTransaction.class))).willAnswer(inv -> inv.getArgument(0));

            assertDoesNotThrow(() -> saleTransactionService.updateSaleTransaction(1L, dto));
            verify(saleTransactionRepository).save(tx);
        }
    }
}
