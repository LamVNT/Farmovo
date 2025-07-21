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
import com.farmovo.backend.repositories.ProductRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import com.farmovo.backend.services.StocktakeService;
import com.farmovo.backend.validator.StocktakeValidator;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import com.farmovo.backend.services.ImportTransactionDetailService;

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
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ImportTransactionDetailService importTransactionDetailService;

    // ENRICH DETAIL UTILITY
    private StocktakeDetailDto enrichDetail(ImportTransactionDetail lot, Product product, StocktakeDetailDto base) {
        StocktakeDetailDto dto = new StocktakeDetailDto();
        dto.setBatchCode(lot.getName());
        dto.setProductId(product.getId());
        dto.setProductName(product.getProductName());
        dto.setZones_id(lot.getZones_id() != null ? List.of(lot.getZones_id().split(",")) : null);
        dto.setRemain(lot.getRemainQuantity());
        dto.setReal(base.getReal());
        dto.setDiff(base.getReal() != null && lot.getRemainQuantity() != null ? base.getReal() - lot.getRemainQuantity() : null);
        dto.setNote(base.getNote());
        dto.setZoneReal(base.getZoneReal());
        dto.setExpireDate(lot.getExpireDate() != null ? lot.getExpireDate().toString() : null);
        dto.setIsCheck(lot.getIsCheck());
        return dto;
    }

    @Override
    public StocktakeResponseDto createStocktake(StocktakeRequestDto requestDto, Long userId) {
        List<StocktakeDetailDto> details = requestDto.getDetail();
        if (details == null || details.isEmpty()) throw new ValidationException("detail is required");
        List<StocktakeDetailDto> enriched = new ArrayList<>();
        for (StocktakeDetailDto d : details) {
            Product product = productRepository.findById(d.getProductId()).orElse(null);
            List<ImportTransactionDetail> lots = importTransactionDetailRepository.findByProductIdAndRemainQuantityGreaterThan(d.getProductId(), 0);
            for (ImportTransactionDetail lot : lots) {
                enriched.add(enrichDetail(lot, product, d));
            }
        }
        Stocktake stocktake = new Stocktake();
        stocktake.setStocktakeDate(Instant.now());
        stocktake.setDetail(new ObjectMapper().writeValueAsString(enriched));
        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));
        Store store = storeRepository.findById(requestDto.getStoreId()).orElseThrow();
        stocktake.setStore(store);
        stocktake.setCreatedBy(userId);
        stocktake = stocktakeRepository.save(stocktake);
        StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
        dto.setStoreName(stocktake.getStore().getStoreName());
        userRepository.findById(userId).ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
        dto.setDetail(enriched);
        dto.setRawDetail(enriched);
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
        List<StocktakeDetailDto> details = new ObjectMapper().readValue(stocktake.getDetail(), new TypeReference<List<StocktakeDetailDto>>(){});
        dto.setDetail(details);
        dto.setRawDetail(details);
        return dto;
    }

    @Override
    public List<StocktakeResponseDto> getAllStocktakes(String storeId, String status, String note, String fromDate, String toDate) {
        // Filter nâng cao
        Specification<Stocktake> spec = (root, query, cb) -> {
            List<javax.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (storeId != null) predicates.add(cb.equal(root.get("store").get("id"), Long.valueOf(storeId)));
            if (status != null) predicates.add(cb.equal(root.get("status"), StocktakeStatus.valueOf(status)));
            if (note != null) predicates.add(cb.like(root.get("stocktakeNote"), "%" + note + "%"));
            if (fromDate != null) predicates.add(cb.greaterThanOrEqualTo(root.get("stocktakeDate"), Instant.parse(fromDate)));
            if (toDate != null) predicates.add(cb.lessThanOrEqualTo(root.get("stocktakeDate"), Instant.parse(toDate)));
            return cb.and(predicates.toArray(new javax.persistence.criteria.Predicate[0]));
        };
        List<Stocktake> stocktakes = stocktakeRepository.findAll(spec);
        List<StocktakeResponseDto> result = new ArrayList<>();
        for (Stocktake stocktake : stocktakes) {
            StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
            dto.setStoreName(stocktake.getStore().getStoreName());
            userRepository.findById(stocktake.getCreatedBy()).ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
            List<StocktakeDetailDto> details = new ObjectMapper().readValue(stocktake.getDetail(), new TypeReference<List<StocktakeDetailDto>>(){});
            dto.setDetail(details);
            dto.setRawDetail(details);
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
        // ENRICH: Nếu chuyển sang COMPLETED thì cập nhật remainQuantity và isCheck cho ImportTransactionDetail
        if (newStatus == StocktakeStatus.COMPLETED) {
            try {
                List<StocktakeDetailDto> details = new ObjectMapper().readValue(stocktake.getDetail(), new com.fasterxml.jackson.core.type.TypeReference<List<StocktakeDetailDto>>(){});
                for (StocktakeDetailDto d : details) {
                    // Giả sử batchCode là name của ImportTransactionDetail
                    List<ImportTransactionDetail> lots = importTransactionDetailRepository.findByProductIdAndRemainQuantityGreaterThan(d.getProductId(), 0);
                    for (ImportTransactionDetail lot : lots) {
                        if (lot.getName().equals(d.getBatchCode())) {
                            // Cập nhật remainQuantity và isCheck
                            if (d.getReal() != null) importTransactionDetailService.updateRemainQuantity(lot.getId(), d.getReal());
                            importTransactionDetailService.updateIsCheck(lot.getId(), true);
                        }
                    }
                }
            } catch (Exception e) {
                throw new ValidationException("Lỗi khi cập nhật tồn kho lô khi hoàn thành kiểm kê: " + e.getMessage());
            }
        }
        stocktake = stocktakeRepository.save(stocktake);
        StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
        dto.setStoreName(stocktake.getStore().getStoreName());
        userRepository.findById(stocktake.getCreatedBy()).ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
        List<StocktakeDetailDto> details = new ObjectMapper().readValue(stocktake.getDetail(), new com.fasterxml.jackson.core.type.TypeReference<List<StocktakeDetailDto>>(){});
        dto.setDetail(details);
        dto.setRawDetail(details);
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

    public ResponseEntity<ByteArrayResource> exportStocktakeToExcel(Long stocktakeId) throws Exception {
        Stocktake stocktake = stocktakeRepository.findById(stocktakeId).orElseThrow();
        List<StocktakeDetailDto> details = new ObjectMapper().readValue(stocktake.getDetail(), new TypeReference<List<StocktakeDetailDto>>(){});
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Stocktake");
        Row header = sheet.createRow(0);
        String[] columns = {"Mã Lô", "Tên hàng", "Khu vực hệ thống", "Tồn kho", "Thực tế", "Khu vực thực tế", "Chênh lệch", "Hạn dùng", "Đã kiểm"};
        for (int i = 0; i < columns.length; i++) header.createCell(i).setCellValue(columns[i]);
        int rowIdx = 1;
        CellStyle redStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setColor(IndexedColors.RED.getIndex());
        redStyle.setFont(font);
        for (StocktakeDetailDto d : details) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(d.getBatchCode());
            row.createCell(1).setCellValue(d.getProductName());
            row.createCell(2).setCellValue(String.join(",", d.getZones_id() != null ? d.getZones_id() : List.of()));
            row.createCell(3).setCellValue(d.getRemain() != null ? d.getRemain() : 0);
            row.createCell(4).setCellValue(d.getReal() != null ? d.getReal() : 0);
            row.createCell(5).setCellValue(d.getZoneReal() != null ? d.getZoneReal() : "");
            Cell diffCell = row.createCell(6);
            diffCell.setCellValue(d.getDiff() != null ? d.getDiff() : 0);
            if (d.getDiff() != null && d.getDiff() != 0) diffCell.setCellStyle(redStyle);
            row.createCell(7).setCellValue(d.getExpireDate() != null ? d.getExpireDate() : "");
            row.createCell(8).setCellValue(d.getIsCheck() != null && d.getIsCheck() ? "Đã kiểm" : "Chưa kiểm");
        }
        for (int i = 0; i < columns.length; i++) sheet.autoSizeColumn(i);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        ByteArrayResource resource = new ByteArrayResource(out.toByteArray());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stocktake_" + stocktakeId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }
} 