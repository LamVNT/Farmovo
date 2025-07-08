package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.models.*;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.services.StocktakeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.farmovo.backend.validator.StocktakeValidator;
import com.farmovo.backend.exceptions.ValidationException;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.mapper.StocktakeMapper;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.*;

@Service
public class StocktakeServiceImpl implements StocktakeService {
    @Autowired
    private StocktakeRepository stocktakeRepository;
    @Autowired
    private StoreRepository storeRepository;
    @Autowired
    private ImportTransactionDetailRepository importTransactionDetailRepository;
    @Autowired
    private StocktakeMapper stocktakeMapper;

    @Override
    public StocktakeResponseDto createStocktake(StocktakeRequestDto requestDto) {
        ObjectMapper mapper = new ObjectMapper();
        List<StocktakeDetail> details;
        try {
            details = mapper.readValue(requestDto.getDetail(), new TypeReference<List<StocktakeDetail>>() {});
        } catch (Exception e) {
            throw new ValidationException("detail is not valid JSON: " + e.getMessage());
        }
        StocktakeValidator.validateRequest(requestDto, details);
        // Tính remain và diff chỉ theo productId (không lặp qua từng zone)
        for (StocktakeDetail d : details) {
            // Đã import ImportTransactionDetail ở đầu file, không cần ghi rõ package nữa
            List<ImportTransactionDetail> lots = importTransactionDetailRepository.findByProductIdAndRemain(d.getProductId());
            int totalRemain = 0;
            for (ImportTransactionDetail lot : lots) {
                totalRemain += (lot.getRemainQuantity() != null ? lot.getRemainQuantity() : 0);
            }
            d.setRemain(totalRemain);
            d.setDiff(d.getReal() != null ? d.getReal() - totalRemain : null);
        }
        // Serialize lại detail
        String updatedDetailJson;
        try {
            updatedDetailJson = mapper.writeValueAsString(details);
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize detail: " + e.getMessage());
        }
        Stocktake stocktake = new Stocktake();
        // Luôn set stocktakeDate là ngày hiện tại
        stocktake.setStocktakeDate(java.time.LocalDate.now());
        stocktake.setDetail(updatedDetailJson);
        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));
        Store store = storeRepository.findById(requestDto.getStoreId()).orElseThrow();
        stocktake.setStore(store);
        stocktake = stocktakeRepository.save(stocktake);
        return stocktakeMapper.toResponseDto(stocktake);
    }

    private List<StocktakeDetailDto> groupDetailsByProduct(List<StocktakeDetailDto> details) {
        Map<Long, StocktakeDetailDto> grouped = new LinkedHashMap<>();
        for (StocktakeDetailDto d : details) {
            StocktakeDetailDto g = grouped.computeIfAbsent(d.getProductId(), k -> {
                StocktakeDetailDto ng = new StocktakeDetailDto();
                ng.setProductId(k);
                ng.setReal(0);
                ng.setZonesId(new ArrayList<>());
                ng.setNote("");
                ng.setRemain(d.getRemain());
                ng.setDiff(0);
                return ng;
            });
            g.setReal(g.getReal() + (d.getReal() != null ? d.getReal() : 0));
            if (d.getZonesId() != null) g.getZonesId().addAll(d.getZonesId());
            g.setNote((g.getNote() == null ? "" : g.getNote()) + (d.getNote() != null ? d.getNote() + "; " : ""));
            g.setRemain(d.getRemain());
            g.setDiff(g.getReal() - g.getRemain());
        }
        // Loại bỏ trùng lặp zone
        for (StocktakeDetailDto g : grouped.values()) {
            if (g.getZonesId() != null) {
                Set<Long> set = new LinkedHashSet<>(g.getZonesId());
                g.setZonesId(new ArrayList<>(set));
            }
        }
        return new ArrayList<>(grouped.values());
    }

    @Override
    public StocktakeResponseDto getStocktakeById(Long id) {
        Stocktake stocktake = stocktakeRepository.findById(id).orElseThrow();
        StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
        // Parse detail JSON thành list detailDto
        ObjectMapper mapper = new ObjectMapper();
        List<StocktakeDetailDto> details;
        try {
            details = mapper.readValue(dto.getDetail(), new TypeReference<List<StocktakeDetailDto>>() {});
        } catch (Exception e) {
            throw new ValidationException("detail is not valid JSON: " + e.getMessage());
        }
        // Group lại detail trước khi trả về
        List<StocktakeDetailDto> grouped = groupDetailsByProduct(details);
        // Serialize lại detail tổng hợp
        try {
            dto.setDetail(mapper.writeValueAsString(grouped));
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize grouped detail: " + e.getMessage());
        }
        return dto;
    }

    @Override
    public List<StocktakeResponseDto> getAllStocktakes() {
        List<StocktakeResponseDto> result = new ArrayList<>();
        for (Stocktake stocktake : stocktakeRepository.findAll()) {
            StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
            ObjectMapper mapper = new ObjectMapper();
            List<StocktakeDetailDto> details;
            try {
                details = mapper.readValue(dto.getDetail(), new TypeReference<List<StocktakeDetailDto>>() {});
            } catch (Exception e) {
                throw new ValidationException("detail is not valid JSON: " + e.getMessage());
            }
            List<StocktakeDetailDto> grouped = groupDetailsByProduct(details);
            try {
                dto.setDetail(mapper.writeValueAsString(grouped));
            } catch (Exception e) {
                throw new ValidationException("Failed to serialize grouped detail: " + e.getMessage());
            }
            result.add(dto);
        }
        return result;
    }

    @Override
    public StocktakeResponseDto updateStocktakeStatus(Long id, String status) {
        Stocktake stocktake = stocktakeRepository.findById(id).orElseThrow();
        stocktake.setStatus(StocktakeStatus.valueOf(status));
        stocktake = stocktakeRepository.save(stocktake);
        return stocktakeMapper.toResponseDto(stocktake);
    }
} 