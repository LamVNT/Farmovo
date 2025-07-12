package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.exceptions.BadRequestException;
import com.farmovo.backend.exceptions.InvalidStatusException;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.mapper.SaleTransactionMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.models.SaleTransactionStatus;
import com.farmovo.backend.repositories.*;
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
    private static final Logger log = LogManager.getLogger(ImportTransactionService.class);
    private final SaleTransactionValidator saleTransactionValidator;

    @Override
    public List<ProductSaleResponseDto> listAllProductResponseDtoByIdPro(Long productId) {
        List<ImportTransactionDetail> details = detailRepository.findByProductId(productId);
        return details.stream()
                .map(productMapper::toDtoSale)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void save(CreateSaleTransactionRequestDto dto, Long userId) {
        saleTransactionValidator.validate(dto); // validate đầu vào

        SaleTransaction transaction = new SaleTransaction();
        transaction.setTotalAmount(dto.getTotalAmount());
        transaction.setPaidAmount(dto.getPaidAmount());
        transaction.setSaleTransactionNote(dto.getSaleTransactionNote());
        transaction.setSaleDate(dto.getSaleDate());
        transaction.setStatus(dto.getStatus());
        transaction.setCreatedBy(userId);

        // Lưu chi tiết dưới dạng JSON string
        try {
            String jsonDetail = objectMapper.writeValueAsString(dto.getDetail());
            transaction.setDetail(jsonDetail);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Không thể chuyển danh sách sản phẩm sang JSON.");
        }

        transaction.setCustomer(customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + dto.getCustomerId())));
        transaction.setStore(storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with ID: " + dto.getStoreId())));

        // Nếu là COMPLETE → trừ kho
        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            deductStockFromBatch(dto.getDetail());
        }

        saleTransactionRepository.save(transaction);
    }


    @Override
    @Transactional
    public void updateSaleTransaction(Long id, CreateSaleTransactionRequestDto dto) {
        saleTransactionValidator.validate(dto); //validate đầu vào

        SaleTransaction transaction = saleTransactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with ID: " + id));

        if (transaction.getStatus() != SaleTransactionStatus.DRAFT) {
            throw new InvalidStatusException("Chỉ được cập nhật giao dịch ở trạng thái DRAFT.");
        }

        transaction.setTotalAmount(dto.getTotalAmount());
        transaction.setPaidAmount(dto.getPaidAmount());
        transaction.setSaleTransactionNote(dto.getSaleTransactionNote());
        transaction.setSaleDate(dto.getSaleDate());
        transaction.setStatus(dto.getStatus());

        transaction.setCustomer(customerRepository.findById(dto.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with ID: " + dto.getCustomerId())));
        transaction.setStore(storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found with ID: " + dto.getStoreId())));

        try {
            String jsonDetail = objectMapper.writeValueAsString(dto.getDetail());
            transaction.setDetail(jsonDetail);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Không thể chuyển danh sách sản phẩm sang JSON.");
        }

        if (dto.getStatus() == SaleTransactionStatus.COMPLETE) {
            deductStockFromBatch(dto.getDetail());
        }

        saleTransactionRepository.save(transaction);
    }


    private void deductStockFromBatch(List<ProductSaleResponseDto> items) {
        for (ProductSaleResponseDto item : items) {
            ImportTransactionDetail batch = importTransactionDetailRepository.findById(item.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found with ID: " + item.getId()));

            if (!batch.getProduct().getId().equals(item.getProId())) {
                throw new BadRequestException("Batch does not belong to selected product (productId=" + item.getProId() + ")");
            }

            if (batch.getRemainQuantity() < item.getQuantity()) {
                throw new BadRequestException("Not enough stock in batch ID: " + item.getId() +
                        " (available=" + batch.getRemainQuantity() + ", required=" + item.getQuantity() + ")");
            }

            batch.setRemainQuantity(batch.getRemainQuantity() - item.getQuantity());
            importTransactionDetailRepository.save(batch);

            log.debug("Deducted {} units from batch ID: {}, remaining: {}",
                    item.getQuantity(), item.getId(), batch.getRemainQuantity());
        }
    }


    @Override
    public List<SaleTransactionResponseDto> getAll() {
        List<SaleTransaction> entities = saleTransactionRepository.findAll();
        return saleTransactionMapper.toResponseDtoList(entities, objectMapper);
    }

}
