package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.*;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Stocktake;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.services.ReportService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.Objects;
import java.util.TreeMap;

import com.farmovo.backend.dto.response.CategoryRemainSummaryDto;
import com.farmovo.backend.dto.response.ProductRemainSummaryDto;
import com.farmovo.backend.dto.response.ZoneRemainSummaryDto;
import com.farmovo.backend.models.Product;
import com.farmovo.backend.models.Category;
import com.farmovo.backend.models.Zone;
import com.farmovo.backend.repositories.ProductRepository;
import com.farmovo.backend.repositories.ZoneRepository;
import com.farmovo.backend.repositories.CategoryRepository;
import com.farmovo.backend.models.SaleTransaction;
import com.farmovo.backend.repositories.ImportTransactionRepository;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.ExpiringLotDto;

import java.util.Optional;

@Service
public class ReportServiceImpl implements ReportService {
    @Autowired
    private ImportTransactionDetailRepository importTransactionDetailRepository;
    @Autowired
    private StocktakeRepository stocktakeRepository;
    @Autowired
    private SaleTransactionRepository saleTransactionRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private ZoneRepository zoneRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private ImportTransactionRepository importTransactionRepository;

    @Override
    public List<ProductRemainDto> getRemainByProduct() {
        List<Object[]> result = importTransactionDetailRepository.getRemainByProduct();
        List<ProductRemainDto> dtos = new ArrayList<>();
        for (Object[] row : result) {
            dtos.add(new ProductRemainDto((Long) row[0], ((Number) row[1]).intValue()));
        }
        return dtos;
    }

    @Override
    public List<RemainByProductReportDto> getRemainByProductAdvanced(String zoneId, Long categoryId, String status) {
        List<ImportTransactionDetail> details = importTransactionDetailRepository.findByRemainQuantityGreaterThan(0);
        List<RemainByProductReportDto> result = new ArrayList<>();

        for (ImportTransactionDetail d : details) {
            // Lọc theo zone
            if (zoneId != null && (d.getZones_id() == null || !d.getZones_id().contains(zoneId))) continue;

            // Lọc theo category
            if (categoryId != null) {
                if (d.getProduct() == null || d.getProduct().getCategory() == null) continue;
                if (!categoryId.equals(d.getProduct().getCategory().getId())) continue;
            }

            // Xác định trạng thái trứng
            String eggStatus = "Tốt";
            if (d.getExpireDate() != null) {
                long daysLeft = ChronoUnit.DAYS.between(LocalDateTime.now(), d.getExpireDate());
                if (daysLeft <= 0) {
                    eggStatus = "Quá hạn";
                } else if (daysLeft <= 3) {
                    eggStatus = "Sắp hết hạn";
                }
            }

            // Lọc theo trạng thái nếu có
            if (status != null && !eggStatus.equalsIgnoreCase(status)) continue;

            result.add(new RemainByProductReportDto(
                    d.getProduct() != null && d.getProduct().getCategory() != null ? d.getProduct().getCategory().getCategoryName() : null,
                    d.getZones_id(),
                    d.getProduct() != null ? d.getProduct().getProductName() : null,
                    eggStatus,
                    d.getRemainQuantity()
            ));
        }

        return result;
    }

    @Override
    public List<StocktakeDetailDto> getStocktakeDiff() {
        Long latestId = stocktakeRepository.findMaxId();
        if (latestId == null) return new ArrayList<>();
        Optional<Stocktake> latestOpt = stocktakeRepository.findById(latestId);
        if (latestOpt.isEmpty()) return new ArrayList<>();
        Stocktake latest = latestOpt.get();
        List<StocktakeDetailDto> diffList = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();
        try {
            List<StocktakeDetailDto> details = mapper.readValue(latest.getDetail(), new com.fasterxml.jackson.core.type.TypeReference<List<StocktakeDetailDto>>() {});
            for (StocktakeDetailDto d : details) {
                if (d.getDiff() != null && d.getDiff() != 0) {
                    diffList.add(d);
                }
            }
        } catch (Exception ignored) {}
        return diffList;
    }

    @Override
    public List<StocktakeDetailDto> getStocktakeDiffById(Long stocktakeId) {
        Long id = stocktakeId;
        if (id == null) {
            id = stocktakeRepository.findMaxId();
        }
        if (id == null) return new ArrayList<>();
        Optional<Stocktake> stocktakeOpt = stocktakeRepository.findById(id);
        if (stocktakeOpt.isEmpty()) return new ArrayList<>();
        Stocktake stocktake = stocktakeOpt.get();
        List<StocktakeDetailDto> diffList = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();
        try {
            List<StocktakeDetailDto> details = mapper.readValue(
                stocktake.getDetail(), new com.fasterxml.jackson.core.type.TypeReference<List<StocktakeDetailDto>>() {});
            for (StocktakeDetailDto d : details) {
                if (d.getDiff() != null && d.getDiff() != 0) {
                    diffList.add(d);
                }
            }
        } catch (Exception ignored) {}
        return diffList;
    }

    @Override
    public List<ExpiringLotDto> getExpiringLots(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusDays(days);
        List<ImportTransactionDetail> lots = importTransactionDetailRepository.findExpiringLots(now, soon);
        List<ExpiringLotDto> result = new ArrayList<>();
        for (ImportTransactionDetail lot : lots) {
            int daysLeft = lot.getExpireDate() != null ? (int) java.time.temporal.ChronoUnit.DAYS.between(now, lot.getExpireDate()) : 0;
            result.add(new ExpiringLotDto(
                lot.getId(),
                lot.getProduct() != null ? lot.getProduct().getProductName() : null,
                lot.getName(),
                lot.getZones_id(),
                lot.getExpireDate(),
                daysLeft
            ));
        }
        return result;
    }

    @Override
    public List<RevenueTrendDto> getRevenueTrend(String type, LocalDateTime from, LocalDateTime to) {
        List<RevenueTrendDto> result = new ArrayList<>();
        List<Object[]> raw;

        switch (type) {
            case "day":
                raw = saleTransactionRepository.getRevenueByDay(from, to);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(row[0].toString());
                    dto.setRevenue((BigDecimal) row[1]);
                    result.add(dto);
                }
                break;
            case "month":
                raw = saleTransactionRepository.getRevenueByMonth(from, to);
                for (Object[] row : raw) {
                    String label = row[0] + "-" + String.format("%02d", row[1]);
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(label);
                    dto.setRevenue((BigDecimal) row[2]);
                    result.add(dto);
                }
                break;
            case "year":
                raw = saleTransactionRepository.getRevenueByYear(from, to);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(row[0].toString());
                    dto.setRevenue((BigDecimal) row[1]);
                    result.add(dto);
                }
                break;
        }

        return result;
    }

    @Override
    public List<StockByCategoryDto> getStockByCategory() {
        List<Object[]> raw = importTransactionDetailRepository.getStockByCategory();
        List<StockByCategoryDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            StockByCategoryDto dto = new StockByCategoryDto();
            dto.setCategory((String) row[0]);
            dto.setStock(((Number) row[1]).intValue());
            result.add(dto);
        }
        return result;
    }

    @Override
    public List<TopProductDto> getTopProducts(LocalDateTime from, LocalDateTime to, int limit) {
        List<Object[]> raw = importTransactionDetailRepository.getTopProducts(from, to, PageRequest.of(0, limit));
        List<TopProductDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            TopProductDto dto = new TopProductDto();
            dto.setProductName((String) row[0]);
            dto.setCategory((String) row[1]);
            dto.setQuantity(row[2] != null ? ((Number) row[2]).longValue() : 0L);
            result.add(dto);
        }
        return result;
    }

    @Override
    public List<TopCustomerDto> getTopCustomers(LocalDateTime from, LocalDateTime to, int limit) {
        List<Object[]> raw = saleTransactionRepository.getTopCustomers(from, to, PageRequest.of(0, limit));
        List<TopCustomerDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            TopCustomerDto dto = new TopCustomerDto();
            dto.setCustomerName((String) row[0]);
            dto.setTotalAmount((BigDecimal) row[1]);
            dto.setOrderCount(row[2] != null ? ((Number) row[2]).longValue() : 0L);
            result.add(dto);
        }
        return result;
    }

    @Override
    public List<InOutSummaryDto> getInOutSummary(LocalDateTime from, LocalDateTime to) {
        // 1. Lấy tồn đầu trước ngày from
        Integer openingStock = 0;
        List<ImportTransactionDetail> allDetails = importTransactionDetailRepository.findByRemainQuantityGreaterThan(0);
        for (ImportTransactionDetail detail : allDetails) {
            ImportTransaction importTransaction = detail.getImportTransaction();
            if (importTransaction != null && importTransaction.getImportDate() != null && importTransaction.getImportDate().isBefore(from)) {
                openingStock += detail.getRemainQuantity() != null ? detail.getRemainQuantity() : 0;
            }
        }

        // 2. Chuẩn bị map ngày -> summary
        TreeMap<LocalDate, InOutSummaryDto> summaryMap = new TreeMap<>();
        LocalDate cursor = from.toLocalDate();
        LocalDate end = to.toLocalDate();
        while (!cursor.isAfter(end)) {
            summaryMap.put(cursor, new InOutSummaryDto(cursor, 0, 0, 0));
            cursor = cursor.plusDays(1);
        }

        // 3. Tổng hợp nhập kho từng ngày
        List<ImportTransaction> importList = importTransactionRepository.findAllImportActive();
        for (ImportTransaction imp : importList) {
            if (imp.getImportDate() == null) continue;
            LocalDate date = imp.getImportDate().toLocalDate();
            if (date.isBefore(from.toLocalDate()) || date.isAfter(to.toLocalDate())) continue;
            int total = 0;
            if (imp.getDetails() != null) {
                for (ImportTransactionDetail d : imp.getDetails()) {
                    total += d.getImportQuantity() != null ? d.getImportQuantity() : 0;
                }
            }
            InOutSummaryDto dto = summaryMap.get(date);
            if (dto != null) dto.setImportQuantity(dto.getImportQuantity() + total);
        }

        // 4. Tổng hợp xuất kho từng ngày
        List<SaleTransaction> saleList = saleTransactionRepository.findAllSaleActive();
        ObjectMapper objectMapper = new ObjectMapper();
        for (SaleTransaction sale : saleList) {
            if (sale.getSaleDate() == null) continue;
            LocalDate date = sale.getSaleDate().toLocalDate();
            if (date.isBefore(from.toLocalDate()) || date.isAfter(to.toLocalDate())) continue;
            int total = 0;
            if (sale.getDetail() != null && !sale.getDetail().isEmpty()) {
                try {
                    List<ProductSaleResponseDto> details = objectMapper.readValue(
                            sale.getDetail(), new TypeReference<List<ProductSaleResponseDto>>() {
                            });
                    for (ProductSaleResponseDto d : details) {
                        if (d.getQuantity() != null) {
                            total += d.getQuantity();
                        }
                    }
                } catch (Exception e) {
                    // log lỗi parse JSON nếu cần
                }
            }
            InOutSummaryDto dto = summaryMap.get(date);
            if (dto != null) dto.setExportQuantity(dto.getExportQuantity() + total);
        }

        // 5. Tính tồn cuối mỗi ngày
        int remain = openingStock;
        for (InOutSummaryDto dto : summaryMap.values()) {
            remain += dto.getImportQuantity() - dto.getExportQuantity();
            dto.setRemainQuantity(remain);
        }
        return new ArrayList<>(summaryMap.values());
    }

    @Override
    public List<CategoryRemainSummaryDto> getRemainSummary() {
        List<ImportTransactionDetail> details = importTransactionDetailRepository.findByRemainQuantityGreaterThan(0);
        Map<String, CategoryRemainSummaryDto> categoryMap = new HashMap<>();
        Map<Long, Product> productMap = productRepository.findAll().stream().collect(Collectors.toMap(Product::getId, p -> p));
        Map<String, Zone> zoneMap = zoneRepository.findAll().stream().collect(Collectors.toMap(z -> z.getId().toString(), z -> z));

        for (ImportTransactionDetail d : details) {
            if (d.getProduct() == null || d.getProduct().getCategory() == null) continue;
            String categoryName = d.getProduct().getCategory().getCategoryName();
            Long productId = d.getProduct().getId();
            String productName = d.getProduct().getProductName();
            Integer remain = d.getRemainQuantity() != null ? d.getRemainQuantity() : 0;
            String zoneId = d.getZones_id();
            String zoneName = zoneMap.getOrDefault(zoneId, new Zone()).getZoneName();

            // Category
            CategoryRemainSummaryDto catDto = categoryMap.computeIfAbsent(categoryName, k -> new CategoryRemainSummaryDto(k, 0, new ArrayList<>()));
            catDto.setTotalRemain(catDto.getTotalRemain() + remain);

            // Product
            ProductRemainSummaryDto prodDto = catDto.getProducts().stream().filter(p -> p.getProductId().equals(productId)).findFirst().orElse(null);
            if (prodDto == null) {
                prodDto = new ProductRemainSummaryDto(productId, productName, 0, new ArrayList<>());
                catDto.getProducts().add(prodDto);
            }
            prodDto.setTotalRemain(prodDto.getTotalRemain() + remain);

            // Zone
            ZoneRemainSummaryDto zoneDto = prodDto.getZones().stream().filter(z -> Objects.equals(z.getZoneId(), zoneId)).findFirst().orElse(null);
            if (zoneDto == null) {
                zoneDto = new ZoneRemainSummaryDto(zoneId, zoneName, 0);
                prodDto.getZones().add(zoneDto);
            }
            zoneDto.setTotalRemain(zoneDto.getTotalRemain() + remain);
        }
        return new ArrayList<>(categoryMap.values());
    }
}
