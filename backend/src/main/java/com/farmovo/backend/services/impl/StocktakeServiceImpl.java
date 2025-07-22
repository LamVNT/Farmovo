package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.StocktakeRequestDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.StocktakeResponseDto;
import com.farmovo.backend.exceptions.ValidationException;
import com.farmovo.backend.mapper.StocktakeMapper;
import com.farmovo.backend.models.*;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.ImportTransactionDetailService;
import com.farmovo.backend.services.StocktakeService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StocktakeServiceImpl implements StocktakeService {
    private final StocktakeRepository stocktakeRepository;
    private final StoreRepository storeRepository;
    private final ImportTransactionDetailRepository importTransactionDetailRepository;
    private final StocktakeMapper stocktakeMapper;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ImportTransactionDetailService importTransactionDetailService;
    private final ObjectMapper objectMapper;

    @Override
    public StocktakeResponseDto createStocktake(StocktakeRequestDto requestDto, Long userId) {
        List<StocktakeDetailDto> details = Optional.ofNullable(requestDto.getDetail())
                .orElseThrow(() -> new ValidationException("detail is required"));
        // enrich detail
        List<StocktakeDetailDto> enriched = enrichStocktakeDetails(details);
        Stocktake stocktake = createStocktakeEntity(requestDto, userId, enriched);
        Stocktake savedStocktake = stocktakeRepository.save(stocktake);
        return buildStocktakeResponseDto(savedStocktake);
    }

    @Override
    public List<StocktakeResponseDto> getAllStocktakes(String storeId, String status, String note, String fromDate, String toDate) {
        Specification<Stocktake> spec = buildStocktakeSpecification(storeId, status, note, fromDate, toDate);
        return stocktakeRepository.findAll(spec).stream()
                .map(this::buildStocktakeResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public StocktakeResponseDto getStocktakeById(Long id) {
        Stocktake stocktake = stocktakeRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Stocktake not found"));
        return buildStocktakeResponseDto(stocktake);
    }

    @Override
    public StocktakeResponseDto updateStocktakeStatus(Long id, String status, Long userId) {
        Stocktake stocktake = stocktakeRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Stocktake not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));
        validateStatusTransition(stocktake.getStatus(), StocktakeStatus.valueOf(status), user);
        stocktake.setStatus(StocktakeStatus.valueOf(status));
        // ENRICH: Nếu chuyển sang COMPLETED thì cập nhật remainQuantity và isCheck cho ImportTransactionDetail
        if (stocktake.getStatus() == StocktakeStatus.COMPLETED) {
            updateImportDetailsForCompletedStocktake(stocktake);
        }
        Stocktake savedStocktake = stocktakeRepository.save(stocktake);
        return buildStocktakeResponseDto(savedStocktake);
    }

    @Override
    public StocktakeResponseDto updateStocktake(Long id, StocktakeRequestDto requestDto) {
        Stocktake stocktake = stocktakeRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Stocktake not found"));
        if (stocktake.getStatus() == StocktakeStatus.COMPLETED || stocktake.getStatus() == StocktakeStatus.CANCELLED) {
            throw new ValidationException("Không thể chỉnh sửa phiếu đã hoàn thành hoặc đã hủy!");
        }
        List<StocktakeDetailDto> rawDetails = Optional.ofNullable(requestDto.getDetail())
                .orElseThrow(() -> new ValidationException("detail is required"));
        updateStocktakeDetails(stocktake, rawDetails, requestDto);
        Stocktake savedStocktake = stocktakeRepository.save(stocktake);
        return buildStocktakeResponseDto(savedStocktake);
    }

    @Override
    public ResponseEntity<ByteArrayResource> exportStocktakeToExcel(Long stocktakeId) throws Exception {
        Stocktake stocktake = stocktakeRepository.findById(stocktakeId)
                .orElseThrow(() -> new ValidationException("Stocktake not found"));
        List<StocktakeDetailDto> details = objectMapper.readValue(stocktake.getDetail(), new TypeReference<>() {});
        Workbook workbook = createExcelWorkbook(details);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        ByteArrayResource resource = new ByteArrayResource(out.toByteArray());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stocktake_" + stocktakeId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }

    // enrich detail utility
    private List<StocktakeDetailDto> enrichStocktakeDetails(List<StocktakeDetailDto> details) {
        List<StocktakeDetailDto> enriched = new ArrayList<>();
        for (StocktakeDetailDto detail : details) {
            Product product = productRepository.findById(detail.getProductId())
                    .orElseThrow(() -> new ValidationException("Product not found: " + detail.getProductId()));
            List<ImportTransactionDetail> lots = importTransactionDetailRepository
                    .findByProductIdAndRemainQuantityGreaterThan(detail.getProductId(), 0);
            // enrich từng lot
            enriched.addAll(lots.stream()
                    .map(lot -> enrichDetail(lot, product, detail))
                    .collect(Collectors.toList()));
        }
        return enriched;
    }

    // enrich từng dòng detail
    private StocktakeDetailDto enrichDetail(ImportTransactionDetail lot, Product product, StocktakeDetailDto base) {
        StocktakeDetailDto dto = new StocktakeDetailDto();
        dto.setBatchCode(lot.getName());
        dto.setProductId(product.getId());
        dto.setProductName(product.getProductName());
        dto.setZones_id(Optional.ofNullable(lot.getZones_id())
                .map(z -> Arrays.asList(z.split(",")))
                .orElse(null));
        dto.setRemain(lot.getRemainQuantity());
        dto.setReal(base.getReal());
        dto.setDiff(base.getReal() != null && lot.getRemainQuantity() != null
                ? base.getReal() - lot.getRemainQuantity() : null);
        dto.setNote(base.getNote());
        dto.setZoneReal(base.getZoneReal());
        dto.setExpireDate(lot.getExpireDate() != null ? lot.getExpireDate().toString() : null);
        dto.setIsCheck(lot.getIsCheck());
        return dto;
    }

    // Tạo entity Stocktake từ request
    private Stocktake createStocktakeEntity(StocktakeRequestDto requestDto, Long userId, List<StocktakeDetailDto> enriched) {
        Stocktake stocktake = new Stocktake();
        stocktake.setStocktakeDate(Instant.now());
        try {
            stocktake.setDetail(objectMapper.writeValueAsString(enriched));
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize stocktake details: " + e.getMessage());
        }
        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));
        // Luôn lấy storeId từ user đang đăng nhập
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ValidationException("User not found"));
        if (user.getStore() == null) {
            throw new ValidationException("User does not have a store assigned");
        }
        Long storeId = user.getStore().getId();
        stocktake.setStore(storeRepository.findById(storeId)
                .orElseThrow(() -> new ValidationException("Store not found")));
        stocktake.setCreatedBy(userId);
        return stocktake;
    }

    // Build response DTO từ entity
    private StocktakeResponseDto buildStocktakeResponseDto(Stocktake stocktake) {
        StocktakeResponseDto dto = stocktakeMapper.toResponseDto(stocktake);
        dto.setStoreName(stocktake.getStore().getStoreName());
        userRepository.findById(stocktake.getCreatedBy())
                .ifPresent(u -> dto.setCreatedByName(u.getFullName() != null ? u.getFullName() : u.getUsername()));
        List<StocktakeDetailDto> details;
        try {
            details = objectMapper.readValue(stocktake.getDetail(), new TypeReference<>() {});
        } catch (Exception e) {
            throw new ValidationException("Failed to deserialize stocktake details: " + e.getMessage());
        }
        dto.setDetail(groupDetailsByProduct(details)); // trả về dạng gộp
        dto.setRawDetail(details); // trả về dạng gốc
        return dto;
    }

    // Build Specification filter nâng cao
    private Specification<Stocktake> buildStocktakeSpecification(String storeId, String status, String note,
                                                                String fromDate, String toDate) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (storeId != null) {
                predicates.add(cb.equal(root.get("store").get("id"), Long.valueOf(storeId)));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), StocktakeStatus.valueOf(status)));
            }
            if (note != null) {
                predicates.add(cb.like(root.get("stocktakeNote"), "%" + note + "%"));
            }
            java.time.ZoneId zone = java.time.ZoneId.systemDefault();
            if (fromDate != null) {
                java.time.LocalDate from = java.time.LocalDate.parse(fromDate);
                java.time.Instant fromInstant = from.atStartOfDay(zone).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("stocktakeDate"), fromInstant));
            }
            if (toDate != null) {
                java.time.LocalDate to = java.time.LocalDate.parse(toDate);
                java.time.Instant toInstant = to.atTime(23, 59, 59).atZone(zone).toInstant();
                predicates.add(cb.lessThanOrEqualTo(root.get("stocktakeDate"), toInstant));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    // Validate chuyển trạng thái
    private void validateStatusTransition(StocktakeStatus currentStatus, StocktakeStatus newStatus, User user) {
        String role = user.getAuthorities().stream()
                .findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElseThrow(() -> new ValidationException("User role not found"));
        if (newStatus == StocktakeStatus.CANCELLED && currentStatus == StocktakeStatus.COMPLETED) {
            throw new ValidationException("Không thể hủy phiếu đã được duyệt hoàn thành!");
        }
        if ("STAFF".equals(role)) {
            if (!(currentStatus == StocktakeStatus.DRAFT && 
                  (newStatus == StocktakeStatus.INPROGRESS || newStatus == StocktakeStatus.CANCELLED))) {
                throw new ValidationException("Staff chỉ được chuyển DRAFT sang INPROGRESS hoặc CANCELLED");
            }
        } else if ("OWNER".equals(role)) {
            if (!(currentStatus == StocktakeStatus.INPROGRESS && 
                  (newStatus == StocktakeStatus.COMPLETED || newStatus == StocktakeStatus.CANCELLED) ||
                  currentStatus == StocktakeStatus.DRAFT && 
                  (newStatus == StocktakeStatus.COMPLETED || newStatus == StocktakeStatus.CANCELLED))) {
                throw new ValidationException("Owner không có quyền thực hiện thao tác này!");
            }
        } else {
            throw new ValidationException("Bạn không có quyền thực hiện thao tác này!");
        }
    }

    // Khi hoàn thành kiểm kê, cập nhật tồn kho lô
    private void updateImportDetailsForCompletedStocktake(Stocktake stocktake) {
        try {
            List<StocktakeDetailDto> details = objectMapper.readValue(stocktake.getDetail(), new TypeReference<>() {});
            for (StocktakeDetailDto detail : details) {
                List<ImportTransactionDetail> lots = importTransactionDetailRepository
                        .findByProductIdAndRemainQuantityGreaterThan(detail.getProductId(), 0);
                for (ImportTransactionDetail lot : lots) {
                    if (lot.getName().equals(detail.getBatchCode())) {
                        if (detail.getReal() != null) {
                            importTransactionDetailService.updateRemainQuantity(lot.getId(), detail.getReal());
                        }
                        importTransactionDetailService.updateIsCheck(lot.getId(), true);
                    }
                }
            }
        } catch (Exception e) {
            throw new ValidationException("Failed to update import details: " + e.getMessage());
        }
    }

    // Cập nhật detail khi update phiếu
    private void updateStocktakeDetails(Stocktake stocktake, List<StocktakeDetailDto> rawDetails, StocktakeRequestDto requestDto) {
        for (StocktakeDetailDto detail : rawDetails) {
            List<ImportTransactionDetail> lots = importTransactionDetailRepository
                    .findByProductIdAndRemain(detail.getProductId());
            int totalRemain = lots.stream()
                    .mapToInt(lot -> lot.getRemainQuantity() != null ? lot.getRemainQuantity() : 0)
                    .sum();
            detail.setRemain(totalRemain);
            detail.setDiff(detail.getReal() != null ? detail.getReal() - totalRemain : null);
        }
        try {
            stocktake.setDetail(objectMapper.writeValueAsString(rawDetails));
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize stocktake details: " + e.getMessage());
        }
        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));
        stocktake.setStore(storeRepository.findById(requestDto.getStoreId())
                .orElseThrow(() -> new ValidationException("Store not found")));
    }

    // Gom nhóm detail theo productId
    private List<StocktakeDetailDto> groupDetailsByProduct(List<StocktakeDetailDto> details) {
        Map<Long, StocktakeDetailDto> grouped = new LinkedHashMap<>();
        for (StocktakeDetailDto detail : details) {
            StocktakeDetailDto groupedDetail = grouped.computeIfAbsent(detail.getProductId(), k -> {
                StocktakeDetailDto newDetail = new StocktakeDetailDto();
                newDetail.setProductId(k);
                newDetail.setReal(0);
                newDetail.setZones_id(new ArrayList<>());
                newDetail.setNote("");
                newDetail.setRemain(detail.getRemain());
                newDetail.setDiff(0);
                return newDetail;
            });
            groupedDetail.setReal(groupedDetail.getReal() + (detail.getReal() != null ? detail.getReal() : 0));
            if (detail.getZones_id() != null) {
                groupedDetail.getZones_id().addAll(detail.getZones_id());
            }
            groupedDetail.setNote((groupedDetail.getNote() == null ? "" : groupedDetail.getNote()) +
                    (detail.getNote() != null ? detail.getNote() + "; " : ""));
            groupedDetail.setRemain(detail.getRemain());
            groupedDetail.setDiff(groupedDetail.getReal() - groupedDetail.getRemain());
        }
        // Loại bỏ trùng lặp zone
        for (StocktakeDetailDto groupedDetail : grouped.values()) {
            if (groupedDetail.getZones_id() != null) {
                groupedDetail.setZones_id(new ArrayList<>(new LinkedHashSet<>(groupedDetail.getZones_id())));
            }
        }
        return new ArrayList<>(grouped.values());
    }

    // Tạo file Excel xuất kiểm kê
    private Workbook createExcelWorkbook(List<StocktakeDetailDto> details) {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Stocktake");
        Row header = sheet.createRow(0);
        String[] columns = {"Mã Lô", "Tên hàng", "Khu vực hệ thống", "Tồn kho", "Thực tế", 
                           "Khu vực thực tế", "Chênh lệch", "Hạn dùng", "Đã kiểm"};
        for (int i = 0; i < columns.length; i++) {
            header.createCell(i).setCellValue(columns[i]);
        }
        CellStyle redStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setColor(IndexedColors.RED.getIndex());
        redStyle.setFont(font);
        int rowIdx = 1;
        for (StocktakeDetailDto detail : details) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(detail.getBatchCode());
            row.createCell(1).setCellValue(detail.getProductName());
            row.createCell(2).setCellValue(String.join(",", detail.getZones_id() != null ? detail.getZones_id() : List.of()));
            row.createCell(3).setCellValue(detail.getRemain() != null ? detail.getRemain() : 0);
            row.createCell(4).setCellValue(detail.getReal() != null ? detail.getReal() : 0);
            row.createCell(5).setCellValue(detail.getZoneReal() != null ? detail.getZoneReal() : "");
            Cell diffCell = row.createCell(6);
            diffCell.setCellValue(detail.getDiff() != null ? detail.getDiff() : 0);
            if (detail.getDiff() != null && detail.getDiff() != 0) {
                diffCell.setCellStyle(redStyle);
            }
            row.createCell(7).setCellValue(detail.getExpireDate() != null ? detail.getExpireDate() : "");
            row.createCell(8).setCellValue(detail.getIsCheck() != null && detail.getIsCheck() ? "Đã kiểm" : "Chưa kiểm");
        }
        for (int i = 0; i < columns.length; i++) {
            sheet.autoSizeColumn(i);
        }
        return workbook;
    }
}