package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.InvalidStatusException;
import com.farmovo.backend.exceptions.SaleTransactionNotFoundException;
import com.farmovo.backend.exceptions.InsufficientStockException;
import com.farmovo.backend.exceptions.TransactionStatusException;
import com.farmovo.backend.exceptions.CustomerNotFoundException;
import com.farmovo.backend.exceptions.StoreNotFoundException;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.mapper.SaleTransactionMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.ImportTransactionStatus;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.SaleTransactionStatus;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.services.ImportTransactionService;
import com.farmovo.backend.services.SaleTransactionService;
import com.farmovo.backend.validator.SaleTransactionValidator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.data.rest.webmvc.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleTransactionServiceImpl implements SaleTransactionService {

    private static final Logger log = LogManager.getLogger(SaleTransactionServiceImpl.class);

    private final ImportTransactionDetailRepository detailRepository;
    private final SaleTransactionRepository saleTransactionRepository;
    private final ProductMapper productMapper;
    private final ObjectMapper objectMapper;
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final SaleTransactionMapper saleTransactionMapper;
    private final ImportTransactionDetailRepository importTransactionDetailRepository;
    private final DebtNoteService debtNoteService;
    private final SaleTransactionValidator saleTransactionValidator;

    @Override
    public List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(Long productId) {
        log.debug("Getting product response details for product ID: {}", productId);

        List<ImportTransactionDetail> details = detailRepository.findByProductId(productId);
        List<ProductSaleResponseDto> result = details.stream()
                .map(productMapper::toDtoSale)
                .collect(Collectors.toList());

        log.debug("Found {} details for product ID: {}", result.size(), productId);
        return result;
    }

    @Override
    @Transactional
    public void save(CreateSaleTransactionRequestDto dto, Long userId) {
        log.info("Saving sale transaction for user: {}, customer: {}, store: {}, totalAmount: {}",
                userId, dto.getCustomerId(), dto.getStoreId(), dto.getTotalAmount());

        saleTransactionValidator.validate(dto);

        SaleTransaction transaction = new SaleTransaction();
        transaction.setTotalAmount(dto.getTotalAmount());
        transaction.setPaidAmount(dto.getPaidAmount());
        transaction.setSaleTransactionNote(dto.getSaleTransactionNote());
        transaction.setSaleDate(dto.getSaleDate());
        transaction.setStatus(dto.getStatus() != null ? dto.getStatus() : SaleTransactionStatus.DRAFT);
        transaction.setCreatedBy(userId);

        try {
            String jsonDetail = objectMapper.writeValueAsString(dto.getDetail());
            transaction.setDetail(jsonDetail);
            log.debug("Transaction details serialized to JSON successfully");
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize transaction details to JSON", e);
            throw new BadRequestException("Không thể chuyển danh sách sản phẩm sang JSON.");
        }

        transaction.setCustomer(customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> {
                    log.error("Customer not found with ID: {}", dto.getCustomerId());
                    return new CustomerNotFoundException("Customer not found with ID: " + dto.getCustomerId());
                }));
        transaction.setStore(storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> {
                    log.error("Store not found with ID: {}", dto.getStoreId());
                    return new StoreNotFoundException("Store not found with ID: " + dto.getStoreId());
                }));

        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            log.info("Transaction status is COMPLETE, deducting stock from batches");
            deductStockFromBatch(dto.getDetail());
        }

        saleTransactionRepository.save(transaction);

        if(dto.getStatus() == SaleTransactionStatus.COMPLETE){
            // Tạo DebtNote nếu paid < || > total
            BigDecimal paidAmount = transaction.getPaidAmount() != null ? transaction.getPaidAmount() : BigDecimal.ZERO;
            BigDecimal totalAmount = transaction.getTotalAmount() != null ? transaction.getTotalAmount() : BigDecimal.ZERO;

            BigDecimal rawDebtAmount = paidAmount.subtract(totalAmount); // Âm: khách nợ | Dương: cửa hàng nợ khách

            if (rawDebtAmount.compareTo(BigDecimal.ZERO) != 0) {
                String debtType = rawDebtAmount.compareTo(BigDecimal.ZERO) < 0 ? "-" : "+";
                BigDecimal debtAmount = rawDebtAmount.abs(); // luôn DƯƠNG khi ghi xuống bảng phiếu nợ

                debtNoteService.createDebtNoteFromTransaction(
                        transaction.getCustomer().getId(),
                        debtAmount,
                        "SALE",
                        debtType,
                        transaction.getId(),
                        transaction.getStore().getId()
                );

                log.info("Created debt note for sale transaction ID: {} with debt amount: {} (type: {})", transaction.getId(), debtAmount, debtType);
            }
        }

        SaleTransaction savedTransaction = saleTransactionRepository.save(transaction);
        log.info("Sale transaction saved successfully with ID: {}", savedTransaction.getId());
    }


    @Override
    @Transactional
    public void updateSaleTransaction(Long id, CreateSaleTransactionRequestDto dto) {
        log.info("Updating sale transaction with ID: {}, status: {}", id, dto.getStatus());

        saleTransactionValidator.validate(dto);

        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Sale transaction not found with ID: {}", id);
                    return new SaleTransactionNotFoundException("Transaction not found with ID: " + id);
                });

        if (transaction.getStatus() != SaleTransactionStatus.DRAFT) {
            log.warn("Attempted to update non-DRAFT transaction with ID: {}, current status: {}",
                    id, transaction.getStatus());
            throw new TransactionStatusException(transaction.getStatus().toString(), "DRAFT", "cập nhật");
        }

        transaction.setTotalAmount(dto.getTotalAmount());
        transaction.setPaidAmount(dto.getPaidAmount());
        transaction.setSaleTransactionNote(dto.getSaleTransactionNote());
        transaction.setSaleDate(dto.getSaleDate());
        transaction.setStatus(dto.getStatus());

        transaction.setCustomer(customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> {
                    log.error("Customer not found with ID: {}", dto.getCustomerId());
                    return new CustomerNotFoundException("Customer not found with ID: " + dto.getCustomerId());
                }));
        transaction.setStore(storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> {
                    log.error("Store not found with ID: {}", dto.getStoreId());
                    return new StoreNotFoundException("Store not found with ID: " + dto.getStoreId());
                }));

        try {
            String jsonDetail = objectMapper.writeValueAsString(dto.getDetail());
            transaction.setDetail(jsonDetail);
            log.debug("Updated transaction details serialized to JSON successfully");
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize updated transaction details to JSON", e);
            throw new BadRequestException("Không thể chuyển danh sách sản phẩm sang JSON.");
        }

        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            log.info("Updated transaction status is COMPLETE, deducting stock from batches");
            deductStockFromBatch(dto.getDetail());
        }

        saleTransactionRepository.save(transaction);
        log.info("Sale transaction with ID: {} updated successfully", id);
    }

    private void deductStockFromBatch(List<ProductSaleResponseDto> items) {
        log.info("Deducting stock from {} batches", items.size());

        for (ProductSaleResponseDto item : items) {
            log.debug("Processing batch ID: {}, product ID: {}, quantity: {}",
                    item.getId(), item.getProId(), item.getQuantity());

            ImportTransactionDetail batch = importTransactionDetailRepository.findById(item.getId())
                    .orElseThrow(() -> {
                        log.error("Batch not found with ID: {}", item.getId());
                        return new ResourceNotFoundException("Batch not found with ID: " + item.getId());
                    });

            if (!batch.getProduct().getId().equals(item.getProId())) {
                log.error("Batch ID: {} does not belong to product ID: {}", item.getId(), item.getProId());
                throw new BadRequestException("Batch does not belong to selected product (productId=" + item.getProId() + ")");
            }

            if (batch.getRemainQuantity() < item.getQuantity()) {
                log.error("Insufficient stock in batch ID: {}, available: {}, required: {}",
                        item.getId(), batch.getRemainQuantity(), item.getQuantity());
                throw new BadRequestException("Not enough stock in batch ID: " + item.getId() +
                        " (available=" + batch.getRemainQuantity() + ", required=" + item.getQuantity() + ")");
            }

            int oldQuantity = batch.getRemainQuantity();
            batch.setRemainQuantity(batch.getRemainQuantity() - item.getQuantity());
            importTransactionDetailRepository.save(batch);

            log.info("Deducted {} units from batch ID: {}, remaining: {} (was: {})",
                    item.getQuantity(), item.getId(), batch.getRemainQuantity(), oldQuantity);
        }

        log.info("Stock deduction completed successfully");
    }

    @Override
    public List<SaleTransactionResponseDto> getAll() {
        log.debug("Getting all sale transactions");

        List<SaleTransaction> entities = saleTransactionRepository.findAll();
        List<SaleTransactionResponseDto> result = saleTransactionMapper.toResponseDtoList(entities, objectMapper);

        log.debug("Retrieved {} sale transactions", result.size());
        return result;
    }

    @Override
    public SaleTransactionResponseDto getById(Long id) {
        log.debug("Getting sale transaction by ID: {}", id);

        SaleTransaction entity = saleTransactionRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Sale transaction not found with ID: {}", id);
                    return new SaleTransactionNotFoundException("Sale transaction not found with ID: " + id);
                });

        SaleTransactionResponseDto result = saleTransactionMapper.toResponseDto(entity, objectMapper);
        log.debug("Retrieved sale transaction with ID: {}", id);
        return result;
    }
}
