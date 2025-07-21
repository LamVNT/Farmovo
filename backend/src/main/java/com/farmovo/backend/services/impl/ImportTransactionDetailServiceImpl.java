package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.mapper.ProductMapper;
import com.farmovo.backend.dto.response.ZoneResponseDto;
import com.farmovo.backend.dto.response.ProductResponseDto;
import com.farmovo.backend.dto.response.ZoneProductDetailDto;
import com.farmovo.backend.dto.response.MissingZoneDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.ImportDetailLotDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.models.Zone;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.services.ImportTransactionDetailService;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import com.farmovo.backend.services.ZoneService;
import com.farmovo.backend.services.ProductService;
import com.farmovo.backend.mapper.ImportTransactionDetailLotMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportTransactionDetailServiceImpl implements ImportTransactionDetailService {

    private static final Logger log = LogManager.getLogger(ImportTransactionDetailServiceImpl.class);

    private final ImportTransactionDetailRepository detailRepository;
    private final ProductMapper productMapper;

    @Autowired
    private ZoneService zoneService;

    @Autowired
    private ProductService productService;

    @Autowired
    private ImportTransactionDetailLotMapper importDetailLotMapper;

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
        List<String> zoneIdStrings = detailRepository.findAllZoneIdsWithProducts();
        Set<Long> zoneIds = new HashSet<>();
        ObjectMapper objectMapper = new ObjectMapper();

        // Parse tất cả zones_id JSON strings và thu thập zoneId
        for (String zoneIdStr : zoneIdStrings) {
            if (zoneIdStr != null && !zoneIdStr.isEmpty()) {
                zoneIds.addAll(parseZonesId(zoneIdStr, objectMapper));
            }
        }

        // Lấy thông tin Zone từ ZoneService
        List<ZoneResponseDto> allZones = zoneService.getAllZones();
        return allZones.stream()
                .filter(zone -> zoneIds.contains(zone.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponseDto> getProductsByZone(String zoneId) {
        List<Long> productIds = detailRepository.findProductIdsByZoneId(zoneId);
        List<ProductResponseDto> allProducts = productService.getAllProducts();

        // Lọc sản phẩm theo productIds và cập nhật thông tin từ ImportTransactionDetail
        return allProducts.stream()
                .filter(product -> productIds.contains(product.getProId()))
                .map(product -> {
                    // Lấy thông tin chi tiết từ ImportTransactionDetail
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
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<ZoneResponseDto> getZonesByProduct(Long productId) {
        List<String> zoneIdStrings = detailRepository.findZoneIdsByProductId(productId);
        Set<Long> zoneIds = new HashSet<>();
        ObjectMapper objectMapper = new ObjectMapper();

        // Parse tất cả zones_id JSON strings và thu thập zoneId
        for (String zoneIdStr : zoneIdStrings) {
            if (zoneIdStr != null && !zoneIdStr.isEmpty()) {
                zoneIds.addAll(parseZonesId(zoneIdStr, objectMapper));
            }
        }

        // Lấy thông tin Zone từ ZoneService
        List<ZoneResponseDto> allZones = zoneService.getAllZones();
        return allZones.stream()
                .filter(zone -> zoneIds.contains(zone.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ZoneProductDetailDto> getDetailsByZone(String zoneId) {
        List<Object[]> rawDetails = detailRepository.findDetailsByZoneId(zoneId);
        List<ZoneProductDetailDto> result = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();

        for (Object[] row : rawDetails) {
            Long importDetailId = (Long) row[0];
            Long productId = (Long) row[1];
            String productName = (String) row[2];
            Integer remainQuantity = (Integer) row[3];
            String zonesIdStr = (String) row[4];
            java.time.LocalDateTime expireDate = (java.time.LocalDateTime) row[5];

            List<Long> zonesId = new ArrayList<>();
            if (zonesIdStr != null && !zonesIdStr.isEmpty()) {
                zonesId = parseZonesId(zonesIdStr, objectMapper);
            }

            result.add(new ZoneProductDetailDto(
                    importDetailId, productId, productName, remainQuantity,
                    expireDate, zonesId, zonesIdStr
            ));
        }

        return result;
    }

    @Override
    public List<MissingZoneDto> checkMissingZones(List<StocktakeDetailDto> stocktakeDetails) {
        List<MissingZoneDto> missingZones = new ArrayList<>();
        ObjectMapper objectMapper = new ObjectMapper();

        for (StocktakeDetailDto stocktakeDetail : stocktakeDetails) {
            Long productId = stocktakeDetail.getProductId();
            List<Long> checkedZoneIds = stocktakeDetail.getZones_id();

            // Lấy tất cả zoneId thực tế của sản phẩm từ ImportTransactionDetail
            List<String> zoneIdStrings = detailRepository.findZoneIdsByProductId(productId);
            Set<Long> actualZoneIds = new HashSet<>();

            // Parse tất cả zones_id JSON strings
            for (String zoneIdStr : zoneIdStrings) {
                if (zoneIdStr != null && !zoneIdStr.isEmpty()) {
                    actualZoneIds.addAll(parseZonesId(zoneIdStr, objectMapper));
                }
            }

            // Tìm zones còn thiếu
            Set<Long> missingZoneIds = new HashSet<>(actualZoneIds);
            missingZoneIds.removeAll(checkedZoneIds);

            // Tìm zones đã kiểm kê
            Set<Long> checkedZoneIdSet = new HashSet<>(checkedZoneIds);

            if (!missingZoneIds.isEmpty()) {
                // Lấy thông tin Zone từ ZoneService
                List<ZoneResponseDto> allZones = zoneService.getAllZones();

                List<ZoneResponseDto> missingZonesList = allZones.stream()
                        .filter(zone -> missingZoneIds.contains(zone.getId()))
                        .collect(Collectors.toList());

                List<ZoneResponseDto> checkedZonesList = allZones.stream()
                        .filter(zone -> checkedZoneIdSet.contains(zone.getId()))
                        .collect(Collectors.toList());

                // Tính tổng số lượng còn lại
                List<ImportTransactionDetail> productDetails = detailRepository.findByProductIdAndRemain(productId);
                Integer totalRemainQuantity = productDetails.stream()
                        .mapToInt(ImportTransactionDetail::getRemainQuantity)
                        .sum();

                // Lấy tên sản phẩm
                String productName = "";
                if (!productDetails.isEmpty()) {
                    productName = productDetails.get(0).getProduct().getProductName();
                }

                missingZones.add(new MissingZoneDto(
                        productId, productName, missingZonesList, checkedZonesList, totalRemainQuantity
                ));
            }
        }

        return missingZones;
    }

    private List<Long> parseZonesId(String zonesIdStr, ObjectMapper objectMapper) {
        if (zonesIdStr == null || zonesIdStr.isEmpty()) return new ArrayList<>();
        try {
            return objectMapper.readValue(zonesIdStr, new com.fasterxml.jackson.core.type.TypeReference<List<Long>>() {});
        } catch (Exception e) {
            // Thử tách chuỗi theo dấu phẩy
            try {
                return java.util.Arrays.stream(zonesIdStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Long::valueOf)
                    .collect(java.util.stream.Collectors.toList());
            } catch (Exception ignore) {
                return new ArrayList<>();
            }
        }
    }

    @Override
    public List<ImportDetailLotDto> findForStocktakeLot(String store, String zone, String product, String importDate, Boolean isCheck, String batchCode) {
        List<ImportTransactionDetail> all = detailRepository.findAll();
        ObjectMapper objectMapper = new ObjectMapper();
        return all.stream().filter(row -> {
            boolean match = true;
            // Bổ sung: loại các lô Remain=0 & IsCheck=true
            if ((row.getRemainQuantity() != null && row.getRemainQuantity() == 0)
                && (row.getIsCheck() != null && row.getIsCheck())) {
                return false;
            }
            if (store != null && !store.isEmpty()) {
                Store s = row.getProduct() != null ? row.getProduct().getStore() : null;
                if (s == null || !s.getStoreName().equalsIgnoreCase(store)) match = false;
            }
            if (zone != null && !zone.isEmpty()) {
                List<Long> zones = parseZonesId(row.getZones_id(), objectMapper);
                if (zones == null || zones.isEmpty()) match = false;
                else {
                    Long zoneId = null;
                    try {
                        zoneId = Long.valueOf(zone);
                    } catch (Exception ignore) {}
                    if (zoneId == null || !zones.contains(zoneId)) match = false;
                }
            }
            if (product != null && !product.isEmpty()) {
                if (row.getProduct() == null || !row.getProduct().getProductName().equalsIgnoreCase(product))
                    match = false;
            }
            if (importDate != null && !importDate.isEmpty()) {
                java.time.LocalDateTime dateTime = row.getImportTransaction() != null ? row.getImportTransaction().getImportDate() : null;
                LocalDate d = dateTime != null ? dateTime.toLocalDate() : null;
                if (d == null || !d.toString().equals(importDate)) match = false;
            }
            if (isCheck != null) {
                if (row.getIsCheck() == null || !row.getIsCheck().equals(isCheck)) match = false;
            }
            // Bổ sung: filter theo batchCode
            if (batchCode != null && !batchCode.isEmpty()) {
                if (row.getName() == null || !row.getName().equalsIgnoreCase(batchCode)) match = false;
            }
            return match;
        }).map(row -> {
            String productName = row.getProduct() != null ? row.getProduct().getProductName() : null;
            String zoneName = null;
            List<Long> zones = parseZonesId(row.getZones_id(), objectMapper);
            if (zones != null && !zones.isEmpty()) {
                List<Zone> allZones = zoneService.getAllZoneEntities();
                List<String> zoneNames = allZones.stream()
                        .filter(z -> zones.contains(z.getId()))
                        .map(Zone::getZoneName)
                        .collect(Collectors.toList());
                zoneName = String.join(", ", zoneNames);
            }
            String storeName = row.getProduct() != null && row.getProduct().getStore() != null ? row.getProduct().getStore().getStoreName() : null;
            java.time.LocalDateTime dateTime = row.getImportTransaction() != null ? row.getImportTransaction().getImportDate() : null;
            LocalDate importDateVal = dateTime != null ? dateTime.toLocalDate() : null;
            return new ImportDetailLotDto(
                    row.getId(),
                    productName,
                    zoneName,
                    storeName,
                    importDateVal,
                    row.getRemainQuantity(),
                    row.getIsCheck(),
                    zones
            );
        }).toList();
    }

    @Override
    public void updateIsCheck(Long id, boolean isCheck) {
        ImportTransactionDetail detail = detailRepository.findById(id).orElseThrow();
        detail.setIsCheck(isCheck);
        detailRepository.save(detail);
    }

    @Override
    public void updateRemainQuantity(Long id, Integer remainQuantity) {
        ImportTransactionDetail detail = detailRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ImportTransactionDetail not found"));
        detail.setRemainQuantity(remainQuantity);
        detailRepository.save(detail);
    }

    @Override
    public ImportDetailLotDto updateRemainQuantityAndReturnDto(Long id, Integer remainQuantity) {
        ImportTransactionDetail detail = detailRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ImportTransactionDetail not found"));
        detail.setRemainQuantity(remainQuantity);
        detailRepository.save(detail);
        return importDetailLotMapper.toDto(detail);
    }

    @Override
    public void completeImportDetail(Long id) {
        ImportTransactionDetail detail = detailRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ImportTransactionDetail not found"));
        detail.setRemainQuantity(-1); // Đánh dấu đã complete, ẩn khỏi bảng
        detailRepository.save(detail);
    }
}
