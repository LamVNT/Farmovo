package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.mapper.SaleTransactionMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.SaleTransactionStatus;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.DebtNoteService;
import com.farmovo.backend.services.SaleTransactionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleTransactionServiceImpl implements SaleTransactionService {

    private final ImportTransactionDetailRepository detailRepository;
    private final SaleTransactionRepository saleTransactionRepository;
    private final ProductMapper productMapper;
    private final ObjectMapper objectMapper; // từ Jackson
    private final CustomerRepository customerRepository;
    private final StoreRepository storeRepository;
    private final SaleTransactionMapper saleTransactionMapper;
    private final ImportTransactionDetailRepository importTransactionDetailRepository;
    private final DebtNoteService debtNoteService;
    private static final Logger logger = LogManager.getLogger(SaleTransactionServiceImpl.class);

    @Override
    public List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(Long productId) {
        List<ImportTransactionDetail> details = detailRepository.findByProductId(productId);
        return details.stream()
                .map(productMapper::toDtoSale)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void save(CreateSaleTransactionRequestDto dto) {

        SaleTransaction transaction = new SaleTransaction();
        transaction.setTotalAmount(dto.getTotalAmount());
        transaction.setPaidAmount(dto.getPaidAmount());

        try {
            String jsonDetail = objectMapper.writeValueAsString(dto.getDetail());
            transaction.setDetail(jsonDetail); // lưu JSON string
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert product list to JSON", e);
        }

        transaction.setSaleTransactionNote(dto.getSaleTransactionNote());
        transaction.setStatus(dto.getStatus());
        transaction.setSaleDate(dto.getSaleDate());
        transaction.setCustomer(
                customerRepository.findById(dto.getCustomerId())
                        .orElseThrow(() -> new RuntimeException("Customer not found"))
        );
        transaction.setStore(
                storeRepository.findById(dto.getStoreId())
                        .orElseThrow(() -> new RuntimeException("Store not found"))
        );

        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            for (ProductSaleResponseDto item : dto.getDetail()) {

                ImportTransactionDetail batch = importTransactionDetailRepository
                        .findById(item.getId())//get id importdetailID
                        .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + item.getId()));

                if (!batch.getProduct().getId().equals(item.getProId())) {
                    throw new RuntimeException("Batch does not belong to selected product");
                }

                if (batch.getRemainQuantity() < item.getQuantity()) { //so sánh hai cái quantity
                    throw new RuntimeException("Not enough stock in batch ID: " + item.getQuantity());
                }

                batch.setRemainQuantity(batch.getRemainQuantity() - item.getQuantity());
                importTransactionDetailRepository.save(batch);
            }
        }

        saleTransactionRepository.save(transaction);

        // Tạo DebtNote nếu paid < || > total
        BigDecimal paidAmount = transaction.getPaidAmount();
        BigDecimal totalAmount = transaction.getTotalAmount();
        BigDecimal debtAmount = paidAmount.subtract(totalAmount);

        if (debtAmount.compareTo(BigDecimal.ZERO) != 0) {
            String debtType = debtAmount.compareTo(BigDecimal.ZERO) < 0 ? "-" : "+";

            debtNoteService.createDebtNoteFromTransaction(
                    transaction.getCustomer().getId(),
                    debtAmount,
                    "SALE",
                    debtType,
                    transaction.getId(),
                    transaction.getStore().getId()
            );
            logger.info("Created debt note for sale transaction ID: {} with debt amount: {}", transaction.getId(), debtAmount);
        }

    }

    @Override
    @Transactional
    public void updateSaleTransaction(Long id, CreateSaleTransactionRequestDto dto) {
        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with ID: " + id));

        if (transaction.getStatus() != SaleTransactionStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT transactions can be updated.");
        }

        transaction.setTotalAmount(dto.getTotalAmount());
        transaction.setPaidAmount(dto.getPaidAmount());
        transaction.setSaleTransactionNote(dto.getSaleTransactionNote());
        transaction.setSaleDate(dto.getSaleDate());
        transaction.setStatus(dto.getStatus());

        transaction.setCustomer(
                customerRepository.findById(dto.getCustomerId())
                        .orElseThrow(() -> new RuntimeException("Customer not found"))
        );

        transaction.setStore(
                storeRepository.findById(dto.getStoreId())
                        .orElseThrow(() -> new RuntimeException("Store not found"))
        );

        try {
            String jsonDetail = objectMapper.writeValueAsString(dto.getDetail());
            transaction.setDetail(jsonDetail); // Lưu lại danh sách detail mới
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert product list to JSON", e);
        }

        // Nếu người dùng cập nhật status thành COMPLETE → phải trừ kho
        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            for (ProductSaleResponseDto item : dto.getDetail()) {

                ImportTransactionDetail batch = importTransactionDetailRepository
                        .findById(item.getId())
                        .orElseThrow(() -> new RuntimeException("Batch not found with ID: " + item.getId()));

                if (!batch.getProduct().getId().equals(item.getProId())) {
                    throw new RuntimeException("Batch does not belong to selected product");
                }

                if (batch.getRemainQuantity() < item.getQuantity()) {
                    throw new RuntimeException("Not enough stock in batch ID: " + item.getId());
                }

                batch.setRemainQuantity(batch.getRemainQuantity() - item.getQuantity());
                importTransactionDetailRepository.save(batch);
            }
        }

        saleTransactionRepository.save(transaction);
    }


    @Override
    public List<SaleTransactionResponseDto> getAll() {
        List<SaleTransaction> entities = saleTransactionRepository.findAll();
        return saleTransactionMapper.toResponseDtoList(entities, objectMapper);
    }

}
