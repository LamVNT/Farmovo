package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.exceptions.ValidationException;
import com.farmovo.backend.mapper.StocktakeMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.StocktakeService;
import com.farmovo.backend.validator.StocktakeValidator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
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
    @Autowired
    private UserRepository userRepository;

    @Override
    public StocktakeResponseDto createStocktake(StocktakeRequestDto requestDto, Long userId) {
        ObjectMapper mapper = new ObjectMapper();
        List<StocktakeDetail> details;
        try {
            details = mapper.readValue(requestDto.getDetail(), new TypeReference<List<StocktakeDetail>>() {
            });
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
        stocktake.setStocktakeDate(Instant.now());
        stocktake.setDetail(updatedDetailJson);
        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));
        Store store = storeRepository.findById(requestDto.getStoreId()).orElseThrow();
        stocktake.setStore(store);
        stocktake.setCreatedBy(userId); // Gán userId vào createdBy
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
                ng.setZones_id(new ArrayList<>()); // snake_case
                ng.setNote("");
                ng.setRemain(d.getRemain());
                ng.setDiff(0);
                return ng;
            });
            g.setReal(g.getReal() + (d.getReal() != null ? d.getReal() : 0));
            if (d.getZones_id() != null) g.getZones_id().addAll(d.getZones_id());
            g.setNote((g.getNote() == null ? "" : g.getNote()) + (d.getNote() != null ? d.getNote() + "; " : ""));
            g.setRemain(d.getRemain());
            g.setDiff(g.getReal() - g.getRemain());
        }
        // Loại bỏ trùng lặp zone
        for (StocktakeDetailDto g : grouped.values()) {
            if (g.getZones_id() != null) {
                Set<Long> set = new LinkedHashSet<>(g.getZones_id());
                g.setZones_id(new ArrayList<>(set));
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
            details = mapper.readValue(dto.getDetail(), new TypeReference<List<StocktakeDetailDto>>() {
            });
        } catch (Exception e) {
            throw new ValidationException("detail is not valid JSON: " + e.getMessage());
        }
        // Group lại detail trước khi trả về
        List<StocktakeDetailDto> grouped = groupDetailsByProduct(details);
        // Serialize lại detail tổng hợp và rawDetail
        try {
            dto.setDetail(mapper.writeValueAsString(grouped)); // dữ liệu đã gộp
            dto.setRawDetail(mapper.writeValueAsString(details)); // dữ liệu chi tiết gốc
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
                details = mapper.readValue(dto.getDetail(), new TypeReference<List<StocktakeDetailDto>>() {
                });
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
    public StocktakeResponseDto updateStocktakeStatus(Long id, String status, Long userId) {
        Stocktake stocktake = stocktakeRepository.findById(id).orElseThrow();
        User user = userRepository.findById(userId).orElseThrow();
        String role = user.getAuthorities().stream().findFirst().map(a -> a.getAuthority().replace("ROLE_", "")).orElse("");
        StocktakeStatus currentStatus = stocktake.getStatus();
        StocktakeStatus newStatus = StocktakeStatus.valueOf(status);
        // Không cho phép hủy nếu đã COMPLETED
        if (newStatus == StocktakeStatus.CANCELLED && currentStatus == StocktakeStatus.COMPLETED) {
            throw new ValidationException("Không thể hủy phiếu đã được duyệt hoàn thành!");
        }
        if ("STAFF".equals(role)) {
            // Staff chỉ được chuyển DRAFT -> INPROGRESS hoặc hủy khi DRAFT
            if (currentStatus == StocktakeStatus.DRAFT && newStatus == StocktakeStatus.INPROGRESS) {
                stocktake.setStatus(newStatus);
            } else if (currentStatus == StocktakeStatus.DRAFT && newStatus == StocktakeStatus.CANCELLED) {
                stocktake.setStatus(newStatus);
            } else {
                throw new ValidationException("Staff không có quyền thực hiện thao tác này!");
            }
        } else if ("OWNER".equals(role)) {
            // Owner được chuyển INPROGRESS -> COMPLETED hoặc hủy khi INPROGRESS
            if (currentStatus == StocktakeStatus.INPROGRESS && newStatus == StocktakeStatus.COMPLETED) {
                stocktake.setStatus(newStatus);
            } else if (currentStatus == StocktakeStatus.INPROGRESS && newStatus == StocktakeStatus.CANCELLED) {
                stocktake.setStatus(newStatus);
            } else if (currentStatus == StocktakeStatus.DRAFT && newStatus == StocktakeStatus.COMPLETED) {
                // Nếu Owner tạo phiếu, cho phép chuyển DRAFT -> COMPLETED
                stocktake.setStatus(newStatus);
            } else if (currentStatus == StocktakeStatus.DRAFT && newStatus == StocktakeStatus.CANCELLED) {
                // Owner cũng có thể hủy khi DRAFT
                stocktake.setStatus(newStatus);
            } else {
                throw new ValidationException("Owner không có quyền thực hiện thao tác này!");
            }
        } else {
            throw new ValidationException("Bạn không có quyền thực hiện thao tác này!");
        }
        stocktake = stocktakeRepository.save(stocktake);
        return stocktakeMapper.toResponseDto(stocktake);
    }

    @Override
    public StocktakeResponseDto updateStocktake(Long id, StocktakeRequestDto requestDto) {
        Stocktake stocktake = stocktakeRepository.findById(id).orElseThrow();
        ObjectMapper mapper = new ObjectMapper();
        List<StocktakeDetail> details;
        try {
            details = mapper.readValue(requestDto.getDetail(), new TypeReference<List<StocktakeDetail>>() {
            });
        } catch (Exception e) {
            throw new ValidationException("detail is not valid JSON: " + e.getMessage());
        }
        StocktakeValidator.validateRequest(requestDto, details);
        // Tính remain và diff lại
        for (StocktakeDetail d : details) {
            List<ImportTransactionDetail> lots = importTransactionDetailRepository.findByProductIdAndRemain(d.getProductId());
            int totalRemain = 0;
            for (ImportTransactionDetail lot : lots) {
                totalRemain += (lot.getRemainQuantity() != null ? lot.getRemainQuantity() : 0);
            }
            d.setRemain(totalRemain);
            d.setDiff(d.getReal() != null ? d.getReal() - totalRemain : null);
        }
        String updatedDetailJson;
        try {
            updatedDetailJson = mapper.writeValueAsString(details);
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize detail: " + e.getMessage());
        }
        stocktake.setDetail(updatedDetailJson);
        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));
        Store store = storeRepository.findById(requestDto.getStoreId()).orElseThrow();
        stocktake.setStore(store);
        stocktake = stocktakeRepository.save(stocktake);
        return stocktakeMapper.toResponseDto(stocktake);
    }
} 