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
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.ImportTransactionRepository;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;
import com.farmovo.backend.models.SaleTransactionStatus;
import com.farmovo.backend.utils.RoleUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class StocktakeServiceImpl implements StocktakeService {
    private final StocktakeRepository stocktakeRepository;
    private final StoreRepository storeRepository;
    private final ImportTransactionDetailRepository importTransactionDetailRepository;
    private final StocktakeMapper stocktakeMapper;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ImportTransactionDetailService importTransactionDetailService;
    private final ObjectMapper objectMapper;
    private final SaleTransactionRepository saleTransactionRepository;
    private final ImportTransactionRepository importTransactionRepository;

    @Override
    public StocktakeResponseDto createStocktake(StocktakeRequestDto requestDto, Long userId) {
        List<StocktakeDetailDto> details = Optional.ofNullable(requestDto.getDetail())
                .orElseThrow(() -> new ValidationException("detail is required"));
        // enrich detail
        List<StocktakeDetailDto> enriched = enrichStocktakeDetails(details);
        Stocktake stocktake = createStocktakeEntity(requestDto, userId, enriched);
        Stocktake savedStocktake = stocktakeRepository.save(stocktake);
        // Lưu ý: tạo phiếu kiểm kê chỉ phục vụ hiển thị; không cập nhật DB lô ở bước này

        return buildStocktakeResponseDto(savedStocktake);
    }

    @Override
    public List<StocktakeResponseDto> getAllStocktakes(String storeId, String status, String note, String fromDate, String toDate, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));
        boolean isStaff = RoleUtils.hasRole(user.getAuthorities(), "STAFF");
        String effectiveStoreId = storeId;
        if (isStaff) {
            if (user.getStore() == null) {
                throw new ValidationException("User does not have a store assigned");
            }
            effectiveStoreId = String.valueOf(user.getStore().getId());
        }
        Specification<Stocktake> spec = buildStocktakeSpecification(effectiveStoreId, status, note, fromDate, toDate);
        return stocktakeRepository.findAll(spec).stream()
                .map(this::buildStocktakeResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<StocktakeResponseDto> searchStocktakes(String storeId, String status, String note, String fromDate, String toDate, Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));
        boolean isStaff = RoleUtils.hasRole(user.getAuthorities(), "STAFF");
        String effectiveStoreId = storeId;
        if (isStaff) {
            if (user.getStore() == null) {
                throw new ValidationException("User does not have a store assigned");
            }
            effectiveStoreId = String.valueOf(user.getStore().getId());
        }
        Specification<Stocktake> spec = buildStocktakeSpecification(effectiveStoreId, status, note, fromDate, toDate);
        return stocktakeRepository.findAll(spec, pageable).map(this::buildStocktakeResponseDto);
    }

    @Override
    public StocktakeResponseDto getStocktakeById(Long id) {
        Stocktake stocktake = stocktakeRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Stocktake not found"));
        return buildStocktakeResponseDto(stocktake);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public StocktakeResponseDto updateStocktakeStatus(Long id, String status, Long userId) {
        Stocktake stocktake = stocktakeRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Stocktake not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));
        validateStatusTransition(stocktake.getStatus(), StocktakeStatus.valueOf(status), user);
        stocktake.setStatus(StocktakeStatus.valueOf(status));
        // Chuyển trạng thái chỉ phục vụ hiển thị; không cập nhật DB lô ở bước này

        Stocktake savedStocktake = stocktakeRepository.save(stocktake);
        return buildStocktakeResponseDto(savedStocktake);
    }

    @Override
    public StocktakeResponseDto updateStocktake(Long id, StocktakeRequestDto requestDto) {
        Stocktake stocktake = stocktakeRepository.findById(id)
                .orElseThrow(() -> new ValidationException("Stocktake not found"));

        // Kiểm tra nếu đang chuyển sang CANCELLED, cho phép cập nhật
        boolean isChangingToCancel = requestDto.getStatus() != null &&
                requestDto.getStatus().equals("CANCELLED") &&
                stocktake.getStatus() != StocktakeStatus.CANCELLED;

        // Chỉ cần kiểm tra nếu không phải chuyển sang CANCELLED
        if (!isChangingToCancel && (stocktake.getStatus() == StocktakeStatus.COMPLETED ||
                stocktake.getStatus() == StocktakeStatus.CANCELLED)) {
            throw new ValidationException("Không thể chỉnh sửa phiếu đã hoàn thành hoặc đã hủy!");
        }

        List<StocktakeDetailDto> rawDetails = Optional.ofNullable(requestDto.getDetail())
                .orElseThrow(() -> new ValidationException("detail is required"));

        // Log để debug
        log.info("Updating stocktake #{} with status={} and detail size={}",
                id, requestDto.getStatus(), rawDetails.size());

        updateStocktakeDetails(stocktake, rawDetails, requestDto);
        Stocktake savedStocktake = stocktakeRepository.save(stocktake);
        // GỘP LOGIC: Nếu cập nhật với status COMPLETED thì cân bằng kho luôn
        // if (stocktake.getStatus() == StocktakeStatus.COMPLETED) {
        //     updateImportDetailsForCompletedStocktake(savedStocktake);
        // }
        return buildStocktakeResponseDto(savedStocktake);
    }

    @Override
    public ResponseEntity<ByteArrayResource> exportStocktakeToExcel(Long stocktakeId) throws Exception {
        Stocktake stocktake = stocktakeRepository.findById(stocktakeId)
                .orElseThrow(() -> new ValidationException("Stocktake not found"));
        List<StocktakeDetailDto> details = objectMapper.readValue(stocktake.getDetail(), new TypeReference<>() {
        });
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteStocktakeById(Long id) {
        stocktakeRepository.deleteById(id);
    }

    // enrich detail utility: enrich từng lô, không group/gộp, chỉ enrich đúng lô theo batchCode + productId (và nếu có zone, ưu tiên match zone)
    private List<StocktakeDetailDto> enrichStocktakeDetails(List<StocktakeDetailDto> details) {
        List<StocktakeDetailDto> enriched = new ArrayList<>();
        log.info("Bắt đầu enrich chi tiết cho {} lô", details.size());

        for (StocktakeDetailDto detail : details) {
            log.info("Enrich lô: batchCode={}, productId={}", detail.getBatchCode(), detail.getProductId());

            if (detail.getProductId() == null) {
                log.warn("Bỏ qua lô do thiếu productId: {}", detail.getBatchCode());
                continue;
            }

            Product product = productRepository.findById(detail.getProductId())
                    .orElseThrow(() -> new ValidationException("Product not found: " + detail.getProductId()));

            // Tìm đúng lô theo batchCode + productId (và nếu có zone, ưu tiên match zone)
            List<ImportTransactionDetail> lots = importTransactionDetailRepository
                    .findByProductIdAndRemainQuantityGreaterThan(detail.getProductId(), 0);

            log.info("Tìm thấy {} lô có productId={}", lots.size(), detail.getProductId());
            boolean found = false;

            for (ImportTransactionDetail lot : lots) {
                log.debug("So sánh lô hệ thống: id={}, name={} với lô nhập: batchCode={}",
                        lot.getId(), lot.getName(), detail.getBatchCode());

                // So sánh cả với và không có dấu gạch ngang
                boolean exactMatch = lot.getName().equals(detail.getBatchCode());
                boolean normalizedMatch = lot.getName().replace("-", "").equals(detail.getBatchCode().replace("-", ""));
                boolean idMatch = (detail.getId() != null && lot.getId().equals(detail.getId()));

                if (exactMatch || normalizedMatch || idMatch) {
                    log.info("Khớp lô: {} - {} (match: exact={}, normalized={}, id={})",
                            lot.getName(), detail.getBatchCode(), exactMatch, normalizedMatch, idMatch);
                    enriched.add(enrichDetail(lot, product, detail));
                    found = true;
                }
            }

            if (!found) {
                log.warn("Không tìm thấy lô phù hợp cho: batchCode={}, productId={}",
                        detail.getBatchCode(), detail.getProductId());

                // Vẫn thêm detail gốc để tránh mất dữ liệu
                enriched.add(detail);
            }
        }

        log.info("Đã enrich xong {} lô", enriched.size());
        return enriched;
    }

    // enrich từng dòng detail
    private StocktakeDetailDto enrichDetail(ImportTransactionDetail lot, Product product, StocktakeDetailDto base) {
        StocktakeDetailDto dto = new StocktakeDetailDto();

        // Đảm bảo luôn giữ ID để truy xuất chính xác
        dto.setId(lot.getId());
        dto.setBatchCode(lot.getName());
        dto.setProductId(product.getId());
        dto.setProductName(product.getProductName());

        // Chuyển đổi zones_id
        dto.setZones_id(Optional.ofNullable(lot.getZones_id())
                .map(z -> {
                    try {
                        if (z.contains("[") && z.contains("]")) {
                            // Có thể là JSON
                            return objectMapper.readValue(z, new TypeReference<List<String>>() {
                            });
                        } else {
                            // Chuỗi phân tách bởi dấu phẩy
                            return Arrays.asList(z.split(","));
                        }
                    } catch (Exception e) {
                        log.warn("Lỗi khi parse zones_id '{}': {}", z, e.getMessage());
                        return Arrays.asList(z.split(","));
                    }
                })
                .orElse(null));

        dto.setRemain(lot.getRemainQuantity());

        // Giữ nguyên giá trị real từ request nếu có
        dto.setReal(base.getReal());

        // Tính toán lại diff
        dto.setDiff(base.getReal() != null && lot.getRemainQuantity() != null
                ? base.getReal() - lot.getRemainQuantity() : null);

        // Copy các trường khác
        dto.setNote(base.getNote());
        dto.setZoneReal(base.getZoneReal());
        dto.setExpireDate(lot.getExpireDate() != null ? lot.getExpireDate().toString() : null);
        // Giữ nguyên trạng thái isCheck từ yêu cầu; mặc định false nếu null
        dto.setIsCheck(base.getIsCheck() != null ? base.getIsCheck() : Boolean.FALSE);

        log.debug("Enriched detail: lot={}, productId={}, remain={}, real={}, diff={}",
                dto.getBatchCode(), dto.getProductId(), dto.getRemain(), dto.getReal(), dto.getDiff());

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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));
        Long storeId;
        boolean isOwner = RoleUtils.hasRole(user.getAuthorities(), "OWNER");
        boolean isStaff = RoleUtils.hasRole(user.getAuthorities(), "STAFF");
        if (isOwner) {
            if (requestDto.getStoreId() == null) {
                throw new ValidationException("storeId is required for OWNER");
            }
            storeId = requestDto.getStoreId();
        } else if (isStaff) {
            if (user.getStore() == null) {
                throw new ValidationException("User does not have a store assigned");
            }
            storeId = user.getStore().getId();
        } else {
            throw new ValidationException("Bạn không có quyền thực hiện thao tác này!");
        }
        stocktake.setStore(storeRepository.findById(storeId)
                .orElseThrow(() -> new ValidationException("Store not found")));
        stocktake.setCreatedBy(userId);
        // Sinh mã tự động cho trường name: KK + 6 số, chỉ lấy id lớn nhất để tránh lỗi LOB
        Long maxId = stocktakeRepository.findMaxId();
        long nextId = maxId != null ? maxId + 1 : 1L;
        String code = String.format("KK%06d", nextId);
        stocktake.setName(code);
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
            details = objectMapper.readValue(stocktake.getDetail(), new TypeReference<>() {
            });
        } catch (Exception e) {
            throw new ValidationException("Failed to deserialize stocktake details: " + e.getMessage());
        }
        dto.setDetail(details); // trả về nguyên từng lô, KHÔNG gộp
        dto.setRawDetail(details); // trả về dạng gốc
        // Ánh xạ thông tin liên kết cân bằng để frontend ẩn nút
        // Các trạng thái cân bằng sẽ được suy ra bằng exists/count sale_transactions theo stocktakeId
        try {
            Long stId = stocktake.getId();
            long count = saleTransactionRepository.countByStocktakeIdAndStatus(stId, SaleTransactionStatus.COMPLETE);
            dto.setBalanceCount(count);
            dto.setHasBalance(count > 0);
            // Kiểm tra phiếu nhập điều chỉnh đã liên kết (nếu có)
            try {
                long importCount = importTransactionRepository.countByStocktakeId(stId);
                dto.setImportCount(importCount);
                dto.setHasImport(importCount > 0);
            } catch (Exception ignored) {
                dto.setImportCount(0L);
                dto.setHasImport(false);
            }
        } catch (Exception e) {
            log.warn("Failed to check PCB linkage for stocktake {}: {}", stocktake.getId(), e.getMessage());
            dto.setHasBalance(false);
            dto.setBalanceCount(0L);
            dto.setHasImport(false);
            dto.setImportCount(0L);
        }
        return dto;
    }

    // Build Specification filter nâng cao
    private Specification<Stocktake> buildStocktakeSpecification(String storeId, String status, String note,
                                                                 String fromDate, String toDate) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (storeId != null && !storeId.isEmpty()) {
                predicates.add(cb.equal(root.get("store").get("id"), Long.valueOf(storeId)));
            }
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), StocktakeStatus.valueOf(status)));
            }
            if (note != null && !note.isEmpty()) {
                predicates.add(cb.like(root.get("stocktakeNote"), "%" + note + "%"));
            }
            java.time.ZoneId zone = java.time.ZoneId.systemDefault();
            if (fromDate != null && !fromDate.isEmpty()) {
                java.time.LocalDate from = java.time.LocalDate.parse(fromDate);
                java.time.Instant fromInstant = from.atStartOfDay(zone).toInstant();
                predicates.add(cb.greaterThanOrEqualTo(root.get("stocktakeDate"), fromInstant));
            }
            if (toDate != null && !toDate.isEmpty()) {
                java.time.LocalDate to = java.time.LocalDate.parse(toDate);
                java.time.Instant toInstant = to.atTime(23, 59, 59).atZone(zone).toInstant();
                predicates.add(cb.lessThanOrEqualTo(root.get("stocktakeDate"), toInstant));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    // Validate chuyển trạng thái
    private void validateStatusTransition(StocktakeStatus currentStatus, StocktakeStatus newStatus, User user) {
        boolean isStaff = RoleUtils.hasRole(user.getAuthorities(), "STAFF");
        boolean isOwner = RoleUtils.hasRole(user.getAuthorities(), "OWNER");
        if (newStatus == StocktakeStatus.CANCELLED && currentStatus == StocktakeStatus.COMPLETED) {
            throw new ValidationException("Không thể hủy phiếu đã được duyệt hoàn thành!");
        }
        if (isStaff) {
            if (!(currentStatus == StocktakeStatus.DRAFT &&
                    (newStatus == StocktakeStatus.COMPLETED || newStatus == StocktakeStatus.CANCELLED))) {
                throw new ValidationException("Staff chỉ được chuyển DRAFT sang COMPLETED hoặc CANCELLED");
            }
        } else if (isOwner) {
            if (!(currentStatus == StocktakeStatus.DRAFT &&
                    (newStatus == StocktakeStatus.COMPLETED || newStatus == StocktakeStatus.CANCELLED))) {
                throw new ValidationException("Owner không có quyền thực hiện thao tác này!");
            }
        } else {
            throw new ValidationException("Bạn không có quyền thực hiện thao tác này!");
        }
    }

    // Khi hoàn thành kiểm kê, cập nhật tồn kho đúng lô (batchCode + productId, ưu tiên match zone nếu có)
    private void updateImportDetailsForCompletedStocktake(Stocktake stocktake) {
        try {
            List<StocktakeDetailDto> details = objectMapper.readValue(stocktake.getDetail(), new TypeReference<>() {
            });
            log.info("[BUG-DEBUG] Bắt đầu cập nhật tồn kho cho {} lô trong phiếu #{}", details.size(), stocktake.getId());

            // Truy vấn tất cả lô theo name trong một lần gọi DB để tối ưu hiệu suất
            List<String> batchCodes = details.stream()
                    .map(StocktakeDetailDto::getBatchCode)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            // Nếu không có batchCode nào, thoát sớm
            if (batchCodes.isEmpty()) {
                log.warn("[BUG-DEBUG] Không có lô nào để cập nhật trong phiếu #{}", stocktake.getId());
                return;
            }

            log.info("Tìm lô theo các mã: {}", String.join(", ", batchCodes));

            // Lấy tất cả lô theo batchCode trong một lần query
            List<ImportTransactionDetail> allLots = importTransactionDetailRepository.findByNameIn(batchCodes);

            // Tạo map để truy xuất nhanh
            Map<String, ImportTransactionDetail> lotsByName = new HashMap<>();
            for (ImportTransactionDetail lot : allLots) {
                lotsByName.put(lot.getName(), lot);
                // Thêm cả phiên bản không có dấu gạch ngang
                lotsByName.put(lot.getName().replace("-", ""), lot);
            }

            log.info("[BUG-DEBUG] Tìm thấy {} lô từ database", allLots.size());

            for (StocktakeDetailDto detail : details) {
                // Stocktake hoàn thành chỉ phục vụ hiển thị; không cập nhật DB lô ở bước này
                // Để cân bằng kho, thao tác cập nhật sẽ được thực hiện khi tạo/duyệt phiếu cân bằng (PCB)
                continue;
            }

            log.info("[BUG-DEBUG] Hoàn thành cập nhật tồn kho cho phiếu #{}", stocktake.getId());
        } catch (Exception e) {
            log.error("[BUG-DEBUG] Lỗi khi cập nhật chi tiết import: {}", e.getMessage(), e);
            throw new ValidationException("Failed to update import details: " + e.getMessage());
        }
    }

    // Cập nhật detail khi update phiếu
    private void updateStocktakeDetails(Stocktake stocktake, List<StocktakeDetailDto> rawDetails, StocktakeRequestDto requestDto) {
        // Xử lý chi tiết chỉ khi không phải trạng thái CANCELLED
        if (!"CANCELLED".equals(requestDto.getStatus())) {
            for (StocktakeDetailDto detail : rawDetails) {
                // Tính lại tồn kho và chênh lệch THEO TỪNG LÔ (không cộng gộp theo sản phẩm)
                Integer remainForThisLot = null;
                try {
                    if (detail.getId() != null) {
                        // Ưu tiên tìm theo id lô
                        remainForThisLot = importTransactionDetailRepository.findById(detail.getId())
                                .map(lot -> lot.getRemainQuantity() != null ? lot.getRemainQuantity() : 0)
                                .orElse(null);
                    }
                    if (remainForThisLot == null && detail.getBatchCode() != null) {
                        // Fallback: tìm theo mã lô (name)
                        var lot = importTransactionDetailRepository.findByName(detail.getBatchCode());
                        if (lot == null && detail.getBatchCode().contains("-")) {
                            // Thử phiên bản bỏ dấu gạch ngang
                            lot = importTransactionDetailRepository.findByName(detail.getBatchCode().replace("-", ""));
                        }
                        if (lot != null) {
                            remainForThisLot = lot.getRemainQuantity() != null ? lot.getRemainQuantity() : 0;
                        }
                    }
                } catch (Exception e) {
                    log.warn("Không thể xác định tồn kho cho lô batchCode={}, id={}, lý do: {}",
                            detail.getBatchCode(), detail.getId(), e.getMessage());
                }

                if (remainForThisLot != null) {
                    detail.setRemain(remainForThisLot);
                    detail.setDiff(detail.getReal() != null ? detail.getReal() - remainForThisLot : null);
                } else {
                    // Nếu không tìm được lô, giữ nguyên remain/diff hiện có để tránh sai lệch
                    log.debug("Giữ nguyên remain/diff cho lô batchCode={}, id={}", detail.getBatchCode(), detail.getId());
                }
            }
        }

        // Log thông tin trước khi serialize
        log.debug("Cập nhật stocktake #{} với status={}, detail size={}",
                stocktake.getId(), requestDto.getStatus(), rawDetails.size());

        try {
            // Lưu chi tiết dù ở trạng thái nào
            stocktake.setDetail(objectMapper.writeValueAsString(rawDetails));
        } catch (Exception e) {
            throw new ValidationException("Failed to serialize stocktake details: " + e.getMessage());
        }

        stocktake.setStocktakeNote(requestDto.getStocktakeNote());
        stocktake.setStatus(StocktakeStatus.valueOf(requestDto.getStatus()));

        // Đảm bảo storeId không null
        if (requestDto.getStoreId() != null) {
            stocktake.setStore(storeRepository.findById(requestDto.getStoreId())
                    .orElseThrow(() -> new ValidationException("Store not found")));
        } else {
            // Giữ nguyên store hiện tại nếu không có storeId mới
            log.warn("StoreId không được cung cấp khi cập nhật stocktake #{}, giữ nguyên store hiện tại", stocktake.getId());
        }
    }

    // Không group/gộp detail, chỉ gộp note nếu cần, còn lại giữ nguyên từng lô
    private List<StocktakeDetailDto> groupDetailsByProduct(List<StocktakeDetailDto> details) {
        // Hoàn tác lại logic cũ: không gộp, trả về chi tiết từng lô.
        // Điều này để đảm bảo trang Detail và Update (Create.jsx) nhận đủ dữ liệu.
        return details;
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