package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.CreateSaleTransactionRequestDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.SaleTransactionResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.mapper.SaleTransactionMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.repositories.CustomerRepository;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.SaleTransactionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Override
    public List<ProductResponseDto> listAllProductResponseDtoByIdPro(Long productId) {
        List<ImportTransactionDetail> details = detailRepository.findByProductId(productId);
        return details.stream()
                .map(productMapper::toDto)
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
        saleTransactionRepository.save(transaction);
    }

    @Override
    public List<SaleTransactionResponseDto> getAll() {
        List<SaleTransaction> entities = saleTransactionRepository.findAll();
        return saleTransactionMapper.toResponseDtoList(entities, objectMapper);
    }

}
