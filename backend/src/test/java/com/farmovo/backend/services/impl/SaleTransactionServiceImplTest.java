package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.exceptions.*;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.mapper.SaleTransactionMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.validator.SaleTransactionValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
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

    @InjectMocks
    private SaleTransactionServiceImpl saleTransactionService;

    @Test
    void testListAllProductResponseDtoByIdPro() {
        Long productId = 1L;
        ImportTransactionDetail detail = new ImportTransactionDetail();
        List<ImportTransactionDetail> details = List.of(detail);
        ProductSaleResponseDto dto = new ProductSaleResponseDto();

        when(importTransactionDetailRepository.findByProductId(productId)).thenReturn(details);
        when(productMapper.toDtoSale(detail)).thenReturn(dto);

        List<ProductSaleResponseDto> result = saleTransactionService.listAllProductResponseDtoByIdPro(productId);

        assertEquals(1, result.size());
        verify(importTransactionDetailRepository).findByProductId(productId);
        verify(productMapper).toDtoSale(detail);
    }

    @Test
    void testSave_ValidInput_ShouldSaveTransaction() {
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(com.farmovo.backend.models.SaleTransactionStatus.DRAFT);
        when(dto.getDetail()).thenReturn(List.of());

        com.farmovo.backend.models.Customer customer = new com.farmovo.backend.models.Customer();
        com.farmovo.backend.models.Store store = new com.farmovo.backend.models.Store();
        when(customerRepository.findById(1L)).thenReturn(java.util.Optional.of(customer));
        when(storeRepository.findById(2L)).thenReturn(java.util.Optional.of(store));
        when(saleTransactionRepository.findTopByOrderByIdDesc()).thenReturn(java.util.Optional.empty());
        when(saleTransactionRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        saleTransactionService.save(dto, 99L);

        verify(saleTransactionValidator).validate(dto);
        verify(saleTransactionRepository, atLeastOnce()).save(any());
    }

    @Test
    void testSave_CustomerNotFound_ShouldThrowException() {
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(com.farmovo.backend.models.SaleTransactionStatus.DRAFT);
        when(dto.getDetail()).thenReturn(List.of());
        when(customerRepository.findById(1L)).thenReturn(java.util.Optional.empty());
        when(saleTransactionRepository.findTopByOrderByIdDesc()).thenReturn(java.util.Optional.empty());

        assertThrows(CustomerNotFoundException.class, () -> {
            saleTransactionService.save(dto, 99L);
        });
    }

    @Test
    void testUpdateSaleTransaction_ValidDraft_ShouldUpdate() {
        Long id = 1L;
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(com.farmovo.backend.models.SaleTransactionStatus.DRAFT);
        when(dto.getDetail()).thenReturn(List.of());

        com.farmovo.backend.models.SaleTransaction transaction = new SaleTransaction();
        transaction.setStatus(SaleTransactionStatus.DRAFT);
        when(saleTransactionRepository.findById(id)).thenReturn(Optional.of(transaction));
        when(customerRepository.findById(1L)).thenReturn(Optional.of(new Customer()));
        when(storeRepository.findById(2L)).thenReturn(Optional.of(new Store()));
        when(saleTransactionRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());

        saleTransactionService.updateSaleTransaction(id, dto);

        verify(saleTransactionValidator).validate(dto);
        verify(saleTransactionRepository).save(transaction);
    }

    @Test
    void testUpdateSaleTransaction_NotDraft_ShouldThrowException() {
        Long id = 1L;
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getStatus()).thenReturn(SaleTransactionStatus.DRAFT);
        com.farmovo.backend.models.SaleTransaction transaction = new SaleTransaction();
        transaction.setStatus(com.farmovo.backend.models.SaleTransactionStatus.COMPLETE);
        when(saleTransactionRepository.findById(id)).thenReturn(Optional.of(transaction));

        assertThrows(TransactionStatusException.class, () -> {
            saleTransactionService.updateSaleTransaction(id, dto);
        });
    }

    @Test
    void testComplete_ValidId_ShouldSetStatusAndCreateDebtNote() {
        Long id = 1L;
        SaleTransaction transaction = new SaleTransaction();
        transaction.setPaidAmount(java.math.BigDecimal.ZERO);
        transaction.setTotalAmount(java.math.BigDecimal.TEN);
        transaction.setCustomer(new Customer());
        transaction.setStore(new Store());
        when(saleTransactionRepository.findById(id)).thenReturn(Optional.of(transaction));
        when(saleTransactionRepository.save(any())).thenReturn(transaction);
        saleTransactionService.complete(id);
        assertEquals(SaleTransactionStatus.COMPLETE, transaction.getStatus());
        verify(saleTransactionRepository).save(transaction);
    }

    @Test
    void testComplete_NotFound_ShouldThrowException() {
        when(saleTransactionRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(SaleTransactionNotFoundException.class, () -> {
            saleTransactionService.complete(1L);
        });
    }

    @Test
    void testCancel_ValidId_ShouldSetStatusCancel() {
        Long id = 1L;
        SaleTransaction transaction = new SaleTransaction();
        when(saleTransactionRepository.findById(id)).thenReturn(Optional.of(transaction));
        when(saleTransactionRepository.save(any())).thenReturn(transaction);
        saleTransactionService.cancel(id);
        assertEquals(SaleTransactionStatus.CANCEL, transaction.getStatus());
        verify(saleTransactionRepository).save(transaction);
    }

    @Test
    void testCancel_NotFound_ShouldThrowException() {
        when(saleTransactionRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> {
            saleTransactionService.cancel(1L);
        });
    }

    @Test
    void testGetNextSaleTransactionCode_ShouldReturnCode() {
        when(saleTransactionRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());
        String code = saleTransactionService.getNextSaleTransactionCode();
        assertTrue(code.startsWith("PB"));
    }

    @Test
    void testSoftDeleteSaleTransaction_ValidId_ShouldSetDeleted() {
        Long id = 1L;
        Long userId = 2L;
        SaleTransaction transaction = new SaleTransaction();
        when(saleTransactionRepository.findById(id)).thenReturn(Optional.of(transaction));
        when(saleTransactionRepository.save(any())).thenReturn(transaction);
        saleTransactionService.softDeleteSaleTransaction(id, userId);
        assertNotNull(transaction.getDeletedAt());
        assertEquals(userId, transaction.getDeletedBy());
        verify(saleTransactionRepository).save(transaction);
    }

    @Test
    void testSoftDeleteSaleTransaction_NotFound_ShouldThrowException() {
        when(saleTransactionRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> {
            saleTransactionService.softDeleteSaleTransaction(1L, 3L);
        });
    }

    @Test
    void testGetById_ValidId_ShouldReturnDto() {
        Long id = 1L;
        SaleTransaction entity = new SaleTransaction();
        SaleTransactionResponseDto dto = new SaleTransactionResponseDto();
        when(saleTransactionRepository.findById(id)).thenReturn(Optional.of(entity));
        when(saleTransactionMapper.toResponseDto(entity, objectMapper)).thenReturn(dto);
        SaleTransactionResponseDto result = saleTransactionService.getById(id);
        assertNotNull(result);
        verify(saleTransactionRepository).findById(id);
        verify(saleTransactionMapper).toResponseDto(entity, objectMapper);
    }

    @Test
    void testGetById_NotFound_ShouldThrowException() {
        when(saleTransactionRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(SaleTransactionNotFoundException.class, () -> {
            saleTransactionService.getById(1L);
        });
    }

    @Test
    void testExportPdf_NotFound_ShouldThrowException() {
        when(saleTransactionRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(org.springframework.data.rest.webmvc.ResourceNotFoundException.class, () -> {
            saleTransactionService.exportPdf(1L);
        });
    }

    // Test exportPdf thành công có thể cần mock nhiều hơn, hoặc chỉ kiểm tra không ném exception
    @Test
    void testExportPdf_ValidId_ShouldReturnBytes() {
        Long id = 1L;
        com.farmovo.backend.models.SaleTransaction transaction = mock(com.farmovo.backend.models.SaleTransaction.class);
        when(saleTransactionRepository.findById(id)).thenReturn(java.util.Optional.of(transaction));
        // Mock các trường cần thiết để không bị NullPointerException
        when(transaction.getCreatedAt()).thenReturn(java.time.LocalDateTime.now());
        when(transaction.getName()).thenReturn("PB000001");
        when(transaction.getStatus()).thenReturn(com.farmovo.backend.models.SaleTransactionStatus.COMPLETE);
        com.farmovo.backend.models.Store store = mock(com.farmovo.backend.models.Store.class);
        when(transaction.getStore()).thenReturn(store);
        when(store.getStoreName()).thenReturn("StoreName");
        when(store.getStoreAddress()).thenReturn("Address");
        com.farmovo.backend.models.Customer customer = mock(com.farmovo.backend.models.Customer.class);
        when(transaction.getCustomer()).thenReturn(customer);
        when(customer.getName()).thenReturn("CustomerName");
        when(customer.getPhone()).thenReturn("0123456789");
        when(customer.getAddress()).thenReturn("CustomerAddress");
        when(transaction.getDetail()).thenReturn("[]");
        when(transaction.getTotalAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(transaction.getPaidAmount()).thenReturn(java.math.BigDecimal.ONE);
        when(transaction.getSaleTransactionNote()).thenReturn("");
        // getStaff sẽ bị gọi, nên cần mock userRepository
        com.farmovo.backend.models.User user = mock(com.farmovo.backend.models.User.class);
        when(userRepository.findById(any())).thenReturn(java.util.Optional.of(user));
        when(user.getFullName()).thenReturn("StaffName");
        byte[] result = saleTransactionService.exportPdf(id);
        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    void testSave_StatusComplete_ShouldDeductStockFromBatch() {
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(SaleTransactionStatus.COMPLETE);
        ProductSaleResponseDto item = new ProductSaleResponseDto();
        item.setId(10L);
        item.setProId(100L);
        item.setQuantity(2);
        when(dto.getDetail()).thenReturn(List.of(item));
        Customer customer = new com.farmovo.backend.models.Customer();
        Store store = new com.farmovo.backend.models.Store();
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(2L)).thenReturn(Optional.of(store));
        when(saleTransactionRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());
        when(saleTransactionRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        // Mock batch đúng product và đủ hàng
        ImportTransactionDetail batch = new ImportTransactionDetail();
        Product product = new Product();
        product.setId(100L);
        batch.setProduct(product);
        batch.setRemainQuantity(5);
        when(importTransactionDetailRepository.findById(10L)).thenReturn(Optional.of(batch));
        saleTransactionService.save(dto, 99L);
        assertEquals(3, batch.getRemainQuantity());
    }

    @Test
    void testDeductStockFromBatch_BatchNotFound_ShouldThrow() {
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(com.farmovo.backend.models.SaleTransactionStatus.COMPLETE);
        ProductSaleResponseDto item = new ProductSaleResponseDto();
        item.setId(10L);
        item.setProId(100L);
        item.setQuantity(2);
        when(dto.getDetail()).thenReturn(List.of(item));
        com.farmovo.backend.models.Customer customer = new com.farmovo.backend.models.Customer();
        com.farmovo.backend.models.Store store = new com.farmovo.backend.models.Store();
        when(customerRepository.findById(1L)).thenReturn(java.util.Optional.of(customer));
        when(storeRepository.findById(2L)).thenReturn(java.util.Optional.of(store));
        when(importTransactionDetailRepository.findById(10L)).thenReturn(java.util.Optional.empty());
        assertThrows(org.springframework.data.rest.webmvc.ResourceNotFoundException.class, () -> {
            saleTransactionService.save(dto, 99L);
        });
    }

    @Test
    void testDeductStockFromBatch_BatchWrongProduct_ShouldThrow() {
        // Given
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(SaleTransactionStatus.COMPLETE);

        ProductSaleResponseDto item = new ProductSaleResponseDto();
        item.setId(10L);        // ID của lô hàng
        item.setProId(100L);    // ID sản phẩm từ request
        item.setQuantity(2);    // Số lượng bán
        when(dto.getDetail()).thenReturn(List.of(item));

        Customer customer = new Customer();
        Store store = new Store();
        when(customerRepository.findById(1L)).thenReturn(Optional.of(customer));
        when(storeRepository.findById(2L)).thenReturn(Optional.of(store));

        // Mock batch với productId khác với dto
        Product product = new Product();
        product.setId(999L); // Khác với item.getProId()
        ImportTransactionDetail batch = new ImportTransactionDetail();
        batch.setProduct(product);
        batch.setRemainQuantity(5);

        when(importTransactionDetailRepository.findById(10L)).thenReturn(Optional.of(batch));

        // When & Then
        assertThrows(BadRequestException.class, () -> {
            saleTransactionService.save(dto, 99L);
        });
    }


    @Test
    void testDeductStockFromBatch_InsufficientStock_ShouldThrow() {
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(com.farmovo.backend.models.SaleTransactionStatus.COMPLETE);
        ProductSaleResponseDto item = new ProductSaleResponseDto();
        item.setId(10L);
        item.setProId(100L);
        item.setQuantity(10);
        when(dto.getDetail()).thenReturn(List.of(item));
        com.farmovo.backend.models.Customer customer = new com.farmovo.backend.models.Customer();
        com.farmovo.backend.models.Store store = new com.farmovo.backend.models.Store();
        when(customerRepository.findById(1L)).thenReturn(java.util.Optional.of(customer));
        when(storeRepository.findById(2L)).thenReturn(java.util.Optional.of(store));
        when(saleTransactionRepository.findTopByOrderByIdDesc()).thenReturn(java.util.Optional.empty());
        // Mock batch đúng product nhưng không đủ hàng
        com.farmovo.backend.models.ImportTransactionDetail batch = new com.farmovo.backend.models.ImportTransactionDetail();
        com.farmovo.backend.models.Product product = new com.farmovo.backend.models.Product();
        product.setId(100L);
        batch.setProduct(product);
        batch.setRemainQuantity(5);
        when(importTransactionDetailRepository.findById(10L)).thenReturn(java.util.Optional.of(batch));
        assertThrows(com.farmovo.backend.exceptions.BadRequestException.class, () -> {
            saleTransactionService.save(dto, 99L);
        });
    }

    @Test
    void testSave_JsonProcessingException_ShouldThrow() throws Exception {
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(com.farmovo.backend.models.SaleTransactionStatus.DRAFT);
        when(dto.getDetail()).thenReturn(List.of());
        com.farmovo.backend.models.Customer customer = new com.farmovo.backend.models.Customer();
        com.farmovo.backend.models.Store store = new com.farmovo.backend.models.Store();

        when(saleTransactionRepository.findTopByOrderByIdDesc()).thenReturn(Optional.empty());
        when(objectMapper.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("error"){});
        assertThrows(com.farmovo.backend.exceptions.BadRequestException.class, () -> {
            saleTransactionService.save(dto, 99L);
        });
    }

    @Test
    void testUpdateSaleTransaction_JsonProcessingException_ShouldThrow() throws Exception {
        Long id = 1L;
        CreateSaleTransactionRequestDto dto = mock(CreateSaleTransactionRequestDto.class);
        when(dto.getCustomerId()).thenReturn(1L);
        when(dto.getStoreId()).thenReturn(2L);
        when(dto.getTotalAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getPaidAmount()).thenReturn(java.math.BigDecimal.TEN);
        when(dto.getStatus()).thenReturn(com.farmovo.backend.models.SaleTransactionStatus.DRAFT);
        when(dto.getDetail()).thenReturn(List.of());
        com.farmovo.backend.models.SaleTransaction transaction = new com.farmovo.backend.models.SaleTransaction();
        transaction.setStatus(com.farmovo.backend.models.SaleTransactionStatus.DRAFT);
        when(saleTransactionRepository.findById(id)).thenReturn(java.util.Optional.of(transaction));
        when(customerRepository.findById(1L)).thenReturn(java.util.Optional.of(new com.farmovo.backend.models.Customer()));
        when(storeRepository.findById(2L)).thenReturn(java.util.Optional.of(new com.farmovo.backend.models.Store()));
        when(saleTransactionRepository.findTopByOrderByIdDesc()).thenReturn(java.util.Optional.empty());
        when(objectMapper.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("error"){});
        assertThrows(com.farmovo.backend.exceptions.BadRequestException.class, () -> {
            saleTransactionService.updateSaleTransaction(id, dto);
        });
    }
} 