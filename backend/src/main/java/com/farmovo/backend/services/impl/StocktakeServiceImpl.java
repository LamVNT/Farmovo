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
        // Lấy rawDetail từ request (frontend gửi vào trường detail)
        List<StocktakeDetail> rawDetails;
        try {
            rawDetails = mapper.readValue(requestDto.getDetail(), new TypeReference<List<StocktakeDetail>>() {});
        } catch (Exception e) {
            throw new ValidationException("detail is not valid JSON: " + e.getMessage());
        }
        StocktakeValidator.validateRequest(requestDto, rawDetails);
        // Tính remain và diff cho từng dòng
        for (StocktakeDetail d : rawDetails) {
            List<ImportTransactionDetail> lots = importTransactionDetailRepository.findByProductIdAndRemain(d.getProductId());
            int totalRemain = 0;
            for (ImportTransactionDetail lot : lots) {
                totalRemain += (lot.getRemainQuantity() != null ? lot.getRemainQuantity() : 0);
            }
            d.setRemain(totalRemain);
            d.setDiff(d.getReal() != null ? d.getReal() - totalRemain : null);
        }
        // Serialize lại rawDetail để lưu vào DB
        String rawDetailJson;
        try {
            rawDetailJson = mapper.writeValueAsString(rawDetails);
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize rawDetail: " + e.getMessage());
        }
        Stocktake stocktake = new Stocktake();
        stocktake.setStocktakeDate(Instant.now());
        stocktake.setDetail(rawDetailJson); // Lưu rawDetail vào trường detail
        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));
        Store store = storeRepository.findById(requestDto.getStoreId()).orElseThrow();
        stocktake.setStore(store);
        stocktake.setCreatedBy(userId);
        stocktake = stocktakeRepository.save(stocktake);
        StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
        dto.setStoreName(stocktake.getStore().getStoreName());
        userRepository.findById(userId).ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
        // Khi trả về, group lại để trả về detail (dạng gộp), còn rawDetail là dữ liệu gốc
        try {
            List<StocktakeDetailDto> detailsDto = mapper.readValue(rawDetailJson, new TypeReference<List<StocktakeDetailDto>>() {});
            List<StocktakeDetailDto> grouped = groupDetailsByProduct(detailsDto);
            dto.setDetail(mapper.writeValueAsString(grouped));
            dto.setRawDetail(mapper.writeValueAsString(detailsDto));
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize grouped detail: " + e.getMessage());
        }
        return dto;
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
        dto.setStoreName(stocktake.getStore().getStoreName());
        userRepository.findById(stocktake.getCreatedBy()).ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
        ObjectMapper mapper = new ObjectMapper();
        List<StocktakeDetailDto> details;
        try {
            details = mapper.readValue(dto.getDetail(), new TypeReference<List<StocktakeDetailDto>>() {});
        } catch (Exception e) {
            throw new ValidationException("detail is not valid JSON: " + e.getMessage());
        }
        // Group lại detail trước khi trả về
        List<StocktakeDetailDto> grouped = groupDetailsByProduct(details);
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
            System.out.println("=== [LOG] Đọc detail từ DB (id=" + stocktake.getId() + "): " + stocktake.getDetail());
            StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
            dto.setStoreName(stocktake.getStore().getStoreName());
            userRepository.findById(stocktake.getCreatedBy()).ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
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
        StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
        dto.setStoreName(stocktake.getStore().getStoreName());
        userRepository.findById(stocktake.getCreatedBy()).ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
        return dto;
    }

    @Override
    public StocktakeResponseDto updateStocktake(Long id, StocktakeRequestDto requestDto) {
        Stocktake stocktake = stocktakeRepository.findById(id).orElseThrow();
        if (stocktake.getStatus() == StocktakeStatus.COMPLETED || stocktake.getStatus() == StocktakeStatus.CANCELLED) {
            throw new ValidationException("Không thể chỉnh sửa phiếu đã hoàn thành hoặc đã hủy!");
        }
        ObjectMapper mapper = new ObjectMapper();
        // Lấy rawDetail từ request (frontend gửi vào trường detail)
        List<StocktakeDetail> rawDetails;
        try {
            rawDetails = mapper.readValue(requestDto.getDetail(), new TypeReference<List<StocktakeDetail>>() {});
        } catch (Exception e) {
            throw new ValidationException("detail is not valid JSON: " + e.getMessage());
        }
        StocktakeValidator.validateRequest(requestDto, rawDetails);
        // Tính remain và diff lại cho từng dòng
        for (StocktakeDetail d : rawDetails) {
            List<ImportTransactionDetail> lots = importTransactionDetailRepository.findByProductIdAndRemain(d.getProductId());
            int totalRemain = 0;
            for (ImportTransactionDetail lot : lots) {
                totalRemain += (lot.getRemainQuantity() != null ? lot.getRemainQuantity() : 0);
            }
            d.setRemain(totalRemain);
            d.setDiff(d.getReal() != null ? d.getReal() - totalRemain : null);
        }
        String rawDetailJson;
        try {
            rawDetailJson = mapper.writeValueAsString(rawDetails);
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize rawDetail: " + e.getMessage());
        }
        stocktake.setDetail(rawDetailJson); // Lưu rawDetail vào trường detail
        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));
        Store store = storeRepository.findById(requestDto.getStoreId()).orElseThrow();
        stocktake.setStore(store);
        stocktake = stocktakeRepository.save(stocktake);
        StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
        dto.setStoreName(stocktake.getStore().getStoreName());
        userRepository.findById(stocktake.getCreatedBy()).ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
        // Khi trả về, group lại để trả về detail (dạng gộp), còn rawDetail là dữ liệu gốc
        try {
            List<StocktakeDetailDto> detailsDto = mapper.readValue(rawDetailJson, new TypeReference<List<StocktakeDetailDto>>() {});
            List<StocktakeDetailDto> grouped = groupDetailsByProduct(detailsDto);
            dto.setDetail(mapper.writeValueAsString(grouped));
            dto.setRawDetail(mapper.writeValueAsString(detailsDto));
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize grouped detail: " + e.getMessage());
        }
        return dto;
    }
} 