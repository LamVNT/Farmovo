package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.*;
import com.farmovo.backend.mapper.ImportTransactionDetailLotMapper;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.models.Zone;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.services.ImportTransactionDetailService;
import com.farmovo.backend.services.ProductService;
import com.farmovo.backend.services.ZoneService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportTransactionDetailServiceImpl implements ImportTransactionDetailService {

    private final ImportTransactionDetailRepository detailRepository;
    private final ProductMapper productMapper;
    private final ZoneService zoneService;
    private final ProductService productService;
    private final ImportTransactionDetailLotMapper importDetailLotMapper;
    private final ObjectMapper objectMapper;

    @Override
    public List<ImportTransactionDetail> findByProductId(Long productId) {
        log.info("Finding import transaction details by productId: {}", productId);
        List<ImportTransactionDetail> result = detailRepository.findByProductId(productId);
        log.info("Found {} import transaction details for productId: {}", result.size(), productId);
        return result;
    }

    // === IMPLEMENTATION CÁC METHOD MỚI ===

    @Override
    public List<ZoneResponseDto> getZonesWithProducts() {
        log.debug("Fetching zones with products");
        Set<Long> zoneIds = detailRepository.findAllZoneIdsWithProducts().stream()
                .filter(Objects::nonNull)
                .flatMap(zoneIdStr -> parseZonesId(zoneIdStr).stream())
                .collect(Collectors.toSet());
        // Lấy thông tin Zone từ ZoneService
        return zoneService.getAllZones().stream()
                .filter(zone -> zoneIds.contains(zone.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponseDto> getProductsByZone(String zoneId) {
        log.debug("Fetching products for zoneId: {}", zoneId);
        List<Long> productIds = detailRepository.findProductIdsByZoneId(zoneId);
        List<ProductResponseDto> allProducts = productService.getAllProducts();
        // Lọc sản phẩm theo productIds và enrich thông tin từ ImportTransactionDetail
        return allProducts.stream()
                .filter(product -> productIds.contains(product.getProId()))
                .map(product -> enrichProductWithDetails(product, zoneId))
                .collect(Collectors.toList());
    }

    @Override
    public List<ZoneResponseDto> getZonesByProduct(Long productId) {
        log.debug("Fetching zones for productId: {}", productId);
        Set<Long> zoneIds = detailRepository.findZoneIdsByProductId(productId).stream()
                .filter(Objects::nonNull)
                .flatMap(zoneIdStr -> parseZonesId(zoneIdStr).stream())
                .collect(Collectors.toSet());
        // Lấy thông tin Zone từ ZoneService
        return zoneService.getAllZones().stream()
                .filter(zone -> zoneIds.contains(zone.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ZoneProductDetailDto> getDetailsByZone(String zoneId) {
        log.debug("Fetching details for zoneId: {}", zoneId);
        // Parse từng dòng kết quả từ repository
        return detailRepository.findDetailsByZoneId(zoneId).stream()
                .map(row -> new ZoneProductDetailDto(
                        (Long) row[0],          // importDetailId
                        (Long) row[1],          // productId
                        (String) row[2],        // productName
                        (Integer) row[3],       // remainQuantity
                        (java.time.LocalDateTime) row[5], // expireDate
                        parseZonesId((String) row[4]),   // zonesId
                        (String) row[4]         // zonesIdStr
                ))
                .collect(Collectors.toList());
    }

    @Override
    public List<MissingZoneDto> checkMissingZones(List<StocktakeDetailDto> stocktakeDetails) {
        log.debug("Checking missing zones for {} stocktake details", stocktakeDetails.size());
        List<MissingZoneDto> missingZones = new ArrayList<>();
        for (StocktakeDetailDto detail : stocktakeDetails) {
            Long productId = detail.getProductId();
            Set<Long> checkedZoneIds = Optional.ofNullable(detail.getZones_id())
                    .map(zones -> zones.stream().map(Long::parseLong).collect(Collectors.toSet()))
                    .orElse(new HashSet<>());
            // Lấy tất cả zoneId thực tế của sản phẩm từ ImportTransactionDetail
            Set<Long> actualZoneIds = detailRepository.findZoneIdsByProductId(productId).stream()
                    .filter(Objects::nonNull)
                    .flatMap(zoneIdStr -> parseZonesId(zoneIdStr).stream())
                    .collect(Collectors.toSet());
            // Tìm zones còn thiếu
            Set<Long> missingZoneIds = new HashSet<>(actualZoneIds);
            missingZoneIds.removeAll(checkedZoneIds);
            if (!missingZoneIds.isEmpty()) {
                // Lấy thông tin Zone từ ZoneService
                List<ZoneResponseDto> allZones = zoneService.getAllZones();
                List<ZoneResponseDto> missingZonesList = allZones.stream()
                        .filter(zone -> missingZoneIds.contains(zone.getId()))
                        .collect(Collectors.toList());
                List<ZoneResponseDto> checkedZonesList = allZones.stream()
                        .filter(zone -> checkedZoneIds.contains(zone.getId()))
                        .collect(Collectors.toList());
                // Tính tổng số lượng còn lại
                List<ImportTransactionDetail> productDetails = detailRepository.findByProductIdAndRemain(productId);
                Integer totalRemainQuantity = productDetails.stream()
                        .mapToInt(ImportTransactionDetail::getRemainQuantity)
                        .sum();
                // Lấy tên sản phẩm
                String productName = productDetails.isEmpty() ? ""
                        : productDetails.get(0).getProduct().getProductName();
                missingZones.add(new MissingZoneDto(
                        productId, productName, missingZonesList, checkedZonesList, totalRemainQuantity
                ));
            }
        }
        return missingZones;
    }

    @Override
    public List<ImportDetailLotDto> findForStocktakeLot(String store, String zone, String product, Boolean isCheck, String batchCode, String search) {
        log.debug("Finding stocktake lots with filters: store={}, zone={}, product={}, search={}", store, zone, product, search);
        return detailRepository.findByRemainQuantityGreaterThan(0).stream()
                .filter(row -> filterStocktakeLot(row, store, zone, product, isCheck, batchCode, search))
                .map(this::mapToImportDetailLotDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateIsCheck(Long id, boolean isCheck) {
        log.debug("Updating isCheck for ImportTransactionDetail id: {}", id);
        ImportTransactionDetail detail = detailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ImportTransactionDetail not found"));
        detail.setIsCheck(isCheck);
        detailRepository.save(detail);
        log.info("Updated isCheck={} for ImportTransactionDetail id={}", isCheck, id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateRemainQuantity(Long id, Integer remainQuantity) {
        log.debug("Updating remainQuantity for ImportTransactionDetail id: {}", id);
        ImportTransactionDetail detail = detailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ImportTransactionDetail not found"));
        // Log giá trị trước khi thay đổi
        log.info("Changing remainQuantity for id={}: {} -> {}", id, detail.getRemainQuantity(), remainQuantity);
        detail.setRemainQuantity(remainQuantity);
        ImportTransactionDetail saved = detailRepository.saveAndFlush(detail); // Đảm bảo flush ngay lập tức
        // Log xác nhận sau khi lưu
        log.info("Confirmed update remainQuantity for id={}: new value={}", saved.getId(), saved.getRemainQuantity());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ImportDetailLotDto updateRemainQuantityAndReturnDto(Long id, Integer remainQuantity) {
        log.debug("Updating remainQuantity and returning DTO for id: {}", id);
        ImportTransactionDetail detail = detailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ImportTransactionDetail not found"));
        // Log giá trị trước khi thay đổi
        log.info("Changing remainQuantity for id={}: {} -> {}", id, detail.getRemainQuantity(), remainQuantity);
        detail.setRemainQuantity(remainQuantity);
        ImportTransactionDetail saved = detailRepository.saveAndFlush(detail); // Đảm bảo flush ngay lập tức
        // Log xác nhận sau khi lưu
        log.info("Confirmed update remainQuantity for id={}: new value={}", saved.getId(), saved.getRemainQuantity());
        return importDetailLotMapper.toDto(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void completeImportDetail(Long id) {
        log.debug("Completing ImportTransactionDetail id: {}", id);
        ImportTransactionDetail detail = detailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ImportTransactionDetail not found"));
        detail.setRemainQuantity(-1); // Đánh dấu đã complete, ẩn khỏi bảng
        detailRepository.saveAndFlush(detail); // Đảm bảo flush ngay lập tức
        log.info("Completed ImportTransactionDetail id={}", id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateZonesId(Long id, String zonesId) {
        log.debug("Updating zonesId for ImportTransactionDetail id: {}", id);
        ImportTransactionDetail detail = detailRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("ImportTransactionDetail not found"));
        // Log giá trị trước khi thay đổi
        log.info("Changing zonesId for id={}: {} -> {}", id, detail.getZones_id(), zonesId);
        detail.setZones_id(zonesId);
        ImportTransactionDetail saved = detailRepository.saveAndFlush(detail); // Đảm bảo flush ngay lập tức
        // Log xác nhận sau khi lưu
        log.info("Confirmed update zonesId for id={}: new value={}", saved.getId(), saved.getZones_id());
    }

    // Hàm enrich thông tin sản phẩm từ ImportTransactionDetail
    private ProductResponseDto enrichProductWithDetails(ProductResponseDto product, String zoneId) {
        List<ImportTransactionDetail> details = detailRepository.findByZoneId(zoneId);
        ImportTransactionDetail detail = details.stream()
                .filter(d -> d.getProduct().getId().equals(product.getProId()))
                .findFirst()
                .orElse(null);
        if (detail != null) {
            product.setId(detail.getId());
            product.setRemainQuantity(detail.getRemainQuantity());
            product.setUnitImportPrice(detail.getUnitImportPrice());
            product.setUnitSalePrice(detail.getUnitSalePrice());
        }
        return product;
    }

    // Hàm parse zones_id từ String (ưu tiên JSON, fallback split chuỗi)
    private List<Long> parseZonesId(String zonesIdStr) {
        if (zonesIdStr == null || zonesIdStr.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(zonesIdStr, new TypeReference<List<Long>>() {
            });
        } catch (Exception e) {
            log.warn("Failed to parse JSON zonesId: {}, falling back to comma-separated parsing", zonesIdStr);
            return Arrays.stream(zonesIdStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::valueOf)
                    .collect(Collectors.toList());
        }
    }

    // Hàm filter logic cho stocktake lot
    private boolean filterStocktakeLot(ImportTransactionDetail row, String store, String zone, String product,
                                       Boolean isCheck, String batchCode, String search) {
        if (row.getRemainQuantity() != null && row.getRemainQuantity() == 0 && row.getIsCheck() != null && row.getIsCheck()) {
            return false;
        }
        if (store != null && !store.isEmpty()) {
            Store s = Optional.ofNullable(row.getProduct()).map(Product::getStore).orElse(null);
            if (s == null || !s.getStoreName().equalsIgnoreCase(store)) {
                return false;
            }
        }
        if (zone != null && !zone.isEmpty()) {
            List<Long> zones = parseZonesId(row.getZones_id());
            if (zones.isEmpty()) {
                return false;
            }
            try {
                Long zoneId = Long.valueOf(zone);
                if (!zones.contains(zoneId)) {
                    return false;
                }
            } catch (NumberFormatException e) {
                return false;
            }
        }
        if (product != null && !product.isEmpty()) {
            String productName = Optional.ofNullable(row.getProduct()).map(Product::getProductName).orElse("");
            if (!productName.toLowerCase().contains(product.toLowerCase())) {
                return false;
            }
        }
        if (isCheck != null && (row.getIsCheck() == null || !row.getIsCheck().equals(isCheck))) {
            return false;
        }
        if (batchCode != null && !batchCode.isEmpty()) {
            if (row.getName() == null || !row.getName().toLowerCase().contains(batchCode.toLowerCase())) {
                return false;
            }
        }
        // Tìm kiếm tự do trên nhiều trường
        if (search != null && !search.isEmpty()) {
            String searchLower = search.toLowerCase();
            String productName = Optional.ofNullable(row.getProduct()).map(Product::getProductName).orElse("");
            String lotName = row.getName() != null ? row.getName() : "";
            String zoneName = zoneService.getAllZoneEntities().stream()
                    .filter(z -> parseZonesId(row.getZones_id()).contains(z.getId()))
                    .map(Zone::getZoneName)
                    .reduce("", (a, b) -> a + ", " + b);
            if (!productName.toLowerCase().contains(searchLower)
                    && !lotName.toLowerCase().contains(searchLower)
                    && !zoneName.toLowerCase().contains(searchLower)) {
                return false;
            }
        }
        return true;
    }

    // Hàm mapping ImportTransactionDetail sang ImportDetailLotDto
    private ImportDetailLotDto mapToImportDetailLotDto(ImportTransactionDetail row) {
        String productName = Optional.ofNullable(row.getProduct())
                .map(Product::getProductName)
                .orElse(null);
        List<Long> zones = parseZonesId(row.getZones_id());
        String zoneName = zones.isEmpty() ? null :
                zoneService.getAllZoneEntities().stream()
                        .filter(z -> zones.contains(z.getId()))
                        .map(Zone::getZoneName)
                        .collect(Collectors.joining(", "));
        String storeName = Optional.ofNullable(row.getProduct())
                .map(Product::getStore)
                .map(Store::getStoreName)
                .orElse(null);
        // Lấy name (mã lô) và hạn dùng (expireDate)
        String name = row.getName();
        java.time.LocalDateTime expireDate = row.getExpireDate();
        return new ImportDetailLotDto(
                row.getId(),
                productName,
                zoneName,
                storeName,
                name,
                expireDate,
                row.getRemainQuantity(),
                row.getIsCheck(),
                zones
        );
    }
}
