package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.*;
import com.farmovo.backend.models.ImportTransaction;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.models.Stocktake;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.ImportTransactionDetailRepository;
import com.farmovo.backend.repositories.SaleTransactionRepository;
import com.farmovo.backend.repositories.StocktakeRepository;
import com.farmovo.backend.services.ReportService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
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
import com.farmovo.backend.models.SaleTransactionStatus;
import com.farmovo.backend.repositories.ImportTransactionRepository;
import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.ExpiringLotDto;

import java.util.Optional;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.util.StringUtils;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.models.ImportTransactionStatus;

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
	@Autowired(required = false)
	private HttpServletRequest request;
	@Autowired
	private UserRepository userRepository;
	@Autowired
	private JwtAuthenticationService jwtAuthenticationService;

	private Long getCurrentUserStoreIdIfStaff() {
		try {
			if (request == null) return null;
			User user = jwtAuthenticationService.extractAuthenticatedUser(request);
			var roles = jwtAuthenticationService.getUserRoles(user);
			if (roles.contains("STAFF") && user != null && user.getStore() != null) {
				return user.getStore().getId();
			}
			return null;
		} catch (Exception e) {
			return null;
		}
	}

    @Override
	    public List<ProductRemainDto> getRemainByProduct(Long storeIdParam) {
        Long storeId = (storeIdParam != null) ? storeIdParam : getCurrentUserStoreIdIfStaff();
        // Chỉ lấy remain từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<Object[]> result = (storeId != null)
                ? importTransactionDetailRepository.getRemainByProductCompletedByStore(ImportTransactionStatus.COMPLETE, storeId)
                : importTransactionDetailRepository.getRemainByProductCompleted(ImportTransactionStatus.COMPLETE);
        List<ProductRemainDto> dtos = new ArrayList<>();
        for (Object[] row : result) {
            dtos.add(new ProductRemainDto((Long) row[0], ((Number) row[1]).intValue()));
        }
        return dtos;
    }

    @Override
    public List<RemainByProductReportDto> getRemainByProductAdvanced(String zoneId, Long categoryId, String status) {
        // Chỉ lấy sản phẩm từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<ImportTransactionDetail> details = importTransactionDetailRepository.findByRemainQuantityGreaterThanAndImportTransactionStatus(0, ImportTransactionStatus.COMPLETE);
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
                    // backfill product fields if absent
                    if ((d.getProductName() == null || d.getProductCode() == null) && d.getProductId() != null) {
                        productRepository.findById(d.getProductId()).ifPresent(p -> {
                            if (d.getProductName() == null) d.setProductName(p.getProductName());
                            if (d.getProductCode() == null) d.setProductCode(p.getProductCode());
                        });
                    }
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
                    // backfill product fields if absent
                    if ((d.getProductName() == null || d.getProductCode() == null) && d.getProductId() != null) {
                        productRepository.findById(d.getProductId()).ifPresent(p -> {
                            if (d.getProductName() == null) d.setProductName(p.getProductName());
                            if (d.getProductCode() == null) d.setProductCode(p.getProductCode());
                        });
                    }
                    diffList.add(d);
                }
            }
        } catch (Exception ignored) {}
        return diffList;
    }

    @Override
	    public List<ExpiringLotDto> getExpiringLots(int days, Long storeIdParam) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusDays(days);
        Long storeId = (storeIdParam != null) ? storeIdParam : getCurrentUserStoreIdIfStaff();
        // Chỉ lấy expiring lots từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<ImportTransactionDetail> lots = (storeId != null)
                ? importTransactionDetailRepository.findExpiringLotsCompletedByStore(storeId, now, soon, ImportTransactionStatus.COMPLETE)
                : importTransactionDetailRepository.findExpiringLotsCompleted(now, soon, ImportTransactionStatus.COMPLETE);
        // Map zoneId -> Zone name
        Map<Long, Zone> zoneMapById = zoneRepository.findAll().stream().collect(Collectors.toMap(Zone::getId, z -> z));
        List<ExpiringLotDto> result = new ArrayList<>();
        for (ImportTransactionDetail lot : lots) {
            int daysLeft = lot.getExpireDate() != null ? (int) java.time.temporal.ChronoUnit.DAYS.between(now, lot.getExpireDate()) : 0;
            String zonesId = lot.getZones_id();
            String zoneNameJoined = null;
            if (zonesId != null && !zonesId.isBlank()) {
                String[] parts = zonesId.split("[;,|\\s]+");
                List<String> names = new ArrayList<>();
                for (String p : parts) {
                    if (p == null || p.isBlank()) continue;
                    try {
                        Long zid = Long.valueOf(p.trim());
                        Zone z = zoneMapById.get(zid);
                        names.add(z != null ? z.getZoneName() : p.trim());
                    } catch (Exception e) {
                        names.add(p.trim());
                    }
                }
                zoneNameJoined = String.join(", ", names);
            }
            result.add(new ExpiringLotDto(
                lot.getId(),
                lot.getProduct() != null ? lot.getProduct().getProductCode() : null,
                lot.getName(),
                zoneNameJoined,
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
			case "day": {
                raw = saleTransactionRepository.getRevenueByDay(from, to);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(row[0].toString());
                    dto.setRevenue((BigDecimal) row[1]);
                    result.add(dto);
                }
                break;
			}
			case "month": {
                raw = saleTransactionRepository.getRevenueByMonth(from, to);
                for (Object[] row : raw) {
                    int yearVal = ((Number) row[0]).intValue();
                    int monthVal = ((Number) row[1]).intValue();
                    String label = yearVal + "-" + String.format("%02d", monthVal);
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(label);
                    BigDecimal revenueVal = (row[2] instanceof BigDecimal)
                            ? (BigDecimal) row[2]
                            : new BigDecimal(((Number) row[2]).toString());
                    dto.setRevenue(revenueVal);
                    result.add(dto);
                }
                break;
			}
			case "year": {
                raw = saleTransactionRepository.getRevenueByYear(from, to);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    int yearVal = ((Number) row[0]).intValue();
                    dto.setLabel(String.valueOf(yearVal));
                    BigDecimal revenueVal = (row[1] instanceof BigDecimal)
                            ? (BigDecimal) row[1]
                            : new BigDecimal(((Number) row[1]).toString());
                    dto.setRevenue(revenueVal);
                    result.add(dto);
                }
                break;
			}
        }

        return result;
    }

    @Override
    public List<RevenueTrendDto> getRevenueTrend(String type, LocalDateTime from, LocalDateTime to, Long storeId) {
        if (storeId == null) {
            return getRevenueTrend(type, from, to);
        }

        List<RevenueTrendDto> result = new ArrayList<>();
        List<Object[]> raw;

        switch (type) {
            case "day": {
                raw = saleTransactionRepository.getRevenueByDayAndStore(from, to, storeId);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(row[0].toString());
                    dto.setRevenue((BigDecimal) row[1]);
                    result.add(dto);
                }
                break;
            }
            case "month": {
                raw = saleTransactionRepository.getRevenueByMonthAndStore(from, to, storeId);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(row[0] + "-" + row[1]);
                    BigDecimal revenueVal = (row[2] instanceof BigDecimal)
                            ? (BigDecimal) row[2]
                            : new BigDecimal(((Number) row[2]).toString());
                    dto.setRevenue(revenueVal);
                    result.add(dto);
                }
                break;
            }
            case "year": {
                raw = saleTransactionRepository.getRevenueByYearAndStore(from, to, storeId);
                for (Object[] row : raw) {
                    RevenueTrendDto dto = new RevenueTrendDto();
                    dto.setLabel(row[0].toString());
                    BigDecimal revenueVal = (row[1] instanceof BigDecimal)
                            ? (BigDecimal) row[1]
                            : new BigDecimal(((Number) row[1]).toString());
                    dto.setRevenue(revenueVal);
                    result.add(dto);
                }
                break;
            }
        }

        return result;
    }

    @Override
    public List<StockByCategoryDto> getStockByCategory() {
        // Chỉ lấy stock từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<Object[]> raw = importTransactionDetailRepository.getStockByCategoryCompleted(ImportTransactionStatus.COMPLETE);
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
    public List<StockByCategoryDto> getStockByCategory(Long storeId) {
        if (storeId == null) {
            return getStockByCategory();
        }
        // Chỉ lấy stock từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<Object[]> raw = importTransactionDetailRepository.getStockByCategoryCompletedByStore(ImportTransactionStatus.COMPLETE, storeId);
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
        // Aggregate by product ID and category from sale transactions' detail JSON
        Map<String, TopProductDto> map = new HashMap<>();
        ObjectMapper objectMapper = new ObjectMapper();
        
        // ✅ THÊM: Cấu hình Jackson để hỗ trợ LocalDateTime
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        List<SaleTransaction> sales = saleTransactionRepository.findAllSaleActiveBetween(from, to);
        
        // Debug: Log số lượng sale transactions
        System.out.println("DEBUG: Found " + sales.size() + " sale transactions between " + from + " and " + to);
        
        for (SaleTransaction s : sales) {
            // Chỉ tính từ các phiếu bán đã hoàn thành (COMPLETE status)
            if (s.getStatus() != SaleTransactionStatus.COMPLETE) {
                continue;
            }
            if (s.getDetail() == null || s.getDetail().isEmpty()) continue;
            try {
                List<ProductSaleResponseDto> details = objectMapper.readValue(
                        s.getDetail(), new TypeReference<List<ProductSaleResponseDto>>() {});
                
                // Debug: Log số lượng details trong sale transaction
                System.out.println("DEBUG: Sale transaction " + s.getId() + " has " + details.size() + " details");
                
                for (ProductSaleResponseDto d : details) {
                    Long productId = d.getProId();
                    Long qty = d.getQuantity() != null ? d.getQuantity().longValue() : 0L;
                    
                    // Bỏ qua nếu productId là null
                    if (productId == null) {
                        System.out.println("DEBUG: Skipping product with null productId");
                        continue;
                    }
                    
                    // Lấy thông tin sản phẩm từ Product table để đảm bảo tính nhất quán
                    Product product = null;
                    String productName = null;
                    String categoryName = null;
                    
                    try {
                        product = productRepository.findById(productId).orElse(null);
                        if (product != null) {
                            productName = product.getProductName();
                            if (product.getCategory() != null) {
                                categoryName = product.getCategory().getCategoryName();
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("DEBUG: Error getting product info for ID " + productId + ": " + e.getMessage());
                        continue;
                    }
                    
                    // Bỏ qua nếu không tìm thấy sản phẩm
                    if (product == null || productName == null || productName.trim().isEmpty()) {
                        System.out.println("DEBUG: Skipping product with ID " + productId + " - not found or invalid name");
                        continue;
                    }
                    
                    // Debug: Log thông tin chi tiết
                    System.out.println("DEBUG: Product ID=" + productId + ", Name=" + productName + ", Category=" + categoryName + ", Quantity=" + qty);
                    
                    // Sử dụng productId làm key để đảm bảo tính nhất quán
                    String key = productId.toString() + "|" + (categoryName != null ? categoryName : "");
                    TopProductDto agg = map.get(key);
                    if (agg == null) {
                        agg = new TopProductDto();
                        agg.setProductName(productName);
                        agg.setCategory(categoryName != null ? categoryName : "Không phân loại");
                        agg.setQuantity(0L);
                        map.put(key, agg);
                    }
                    agg.setQuantity(agg.getQuantity() + qty);
                }
            } catch (Exception e) {
                System.err.println("DEBUG: Error parsing sale transaction detail: " + e.getMessage());
            }
        }
        
        // Debug: Log kết quả cuối cùng
        System.out.println("DEBUG: Final result has " + map.size() + " unique products");
        for (Map.Entry<String, TopProductDto> entry : map.entrySet()) {
            System.out.println("DEBUG: " + entry.getKey() + " -> " + entry.getValue().getProductName() + " (Category: " + entry.getValue().getCategory() + ")");
        }
        
        List<TopProductDto> result = new ArrayList<>(map.values());
        result.sort((a, b) -> Long.compare(b.getQuantity() != null ? b.getQuantity() : 0L, a.getQuantity() != null ? a.getQuantity() : 0L));
        if (result.size() > limit) {
            return result.subList(0, limit);
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
    public List<TopProductDto> getTopProducts(LocalDateTime from, LocalDateTime to, int limit, Long storeId) {
        if (storeId == null) {
            return getTopProducts(from, to, limit);
        }

        // Similar logic but filter by store
        Map<String, TopProductDto> map = new HashMap<>();
        ObjectMapper objectMapper = new ObjectMapper();
        
        // ✅ THÊM: Cấu hình Jackson để hỗ trợ LocalDateTime
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        List<SaleTransaction> sales = saleTransactionRepository.findAllSaleActiveByStore(storeId);

        // Debug log
        System.out.println("DEBUG: Found " + sales.size() + " sales for store " + storeId);

        for (SaleTransaction s : sales) {
            // Kiểm tra thời gian
            if (s.getSaleDate() == null || s.getSaleDate().isBefore(from) || s.getSaleDate().isAfter(to)) {
                System.out.println("DEBUG: Skipping sale " + s.getId() + " due to date: " + s.getSaleDate());
                continue;
            }
            
            // Kiểm tra trạng thái
            if (!SaleTransactionStatus.COMPLETE.equals(s.getStatus())) {
                System.out.println("DEBUG: Skipping sale " + s.getId() + " due to status: " + s.getStatus());
                continue;
            }
            
            if (s.getDetail() == null || s.getDetail().isEmpty()) {
                System.out.println("DEBUG: Skipping sale " + s.getId() + " due to empty detail");
                continue;
            }

            try {
                List<ProductSaleResponseDto> details = objectMapper.readValue(
                        s.getDetail(), new TypeReference<List<ProductSaleResponseDto>>() {});
                
                System.out.println("DEBUG: Sale transaction " + s.getId() + " has " + details.size() + " details");
                
                for (ProductSaleResponseDto d : details) {
                    Long productId = d.getProId();
                    Long qty = d.getQuantity() != null ? d.getQuantity().longValue() : 0L;
                    
                    // Bỏ qua nếu productId là null
                    if (productId == null) {
                        System.out.println("DEBUG: Skipping product with null productId");
                        continue;
                    }
                    
                    // Lấy thông tin sản phẩm từ Product table để đảm bảo tính nhất quán
                    Product product = null;
                    String productName = null;
                    String categoryName = null;
                    
                    try {
                        product = productRepository.findById(productId).orElse(null);
                        if (product != null) {
                            productName = product.getProductName();
                            if (product.getCategory() != null) {
                                categoryName = product.getCategory().getCategoryName();
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("DEBUG: Error getting product info for ID " + productId + ": " + e.getMessage());
                        continue;
                    }
                    
                    // Bỏ qua nếu không tìm thấy sản phẩm
                    if (product == null || productName == null || productName.trim().isEmpty()) {
                        System.out.println("DEBUG: Skipping product with ID " + productId + " - not found or invalid name");
                        continue;
                    }
                    
                    // Debug log
                    System.out.println("DEBUG: Product ID=" + productId + ", Name=" + productName + ", Category=" + categoryName + ", Quantity=" + qty);
                    
                    // Sử dụng productId làm key để đảm bảo tính nhất quán
                    String key = productId.toString() + "|" + (categoryName != null ? categoryName : "");
                    TopProductDto agg = map.get(key);
                    if (agg == null) {
                        agg = new TopProductDto();
                        agg.setProductName(productName);
                        agg.setCategory(categoryName != null ? categoryName : "Không phân loại");
                        agg.setQuantity(0L);
                        map.put(key, agg);
                    }
                    agg.setQuantity(agg.getQuantity() + qty);
                }
            } catch (Exception e) {
                System.err.println("DEBUG: Error parsing sale transaction detail: " + e.getMessage());
                e.printStackTrace(); // Thêm stack trace để debug
            }
        }
        
        // Debug log kết quả cuối cùng
        System.out.println("DEBUG: Final result has " + map.size() + " unique products");
        for (Map.Entry<String, TopProductDto> entry : map.entrySet()) {
            System.out.println("DEBUG: " + entry.getKey() + " -> " + entry.getValue().getProductName() + " (Category: " + entry.getValue().getCategory() + ")");
        }
        
        List<TopProductDto> result = new ArrayList<>(map.values());
        result.sort((a, b) -> Long.compare(b.getQuantity() != null ? b.getQuantity() : 0L, a.getQuantity() != null ? a.getQuantity() : 0L));
        if (result.size() > limit) {
            return result.subList(0, limit);
        }
        return result;
    }

    @Override
    public List<TopCustomerDto> getTopCustomers(LocalDateTime from, LocalDateTime to, int limit, Long storeId) {
        if (storeId == null) {
            return getTopCustomers(from, to, limit);
        }

        List<Object[]> raw = saleTransactionRepository.getTopCustomersByStore(from, to, storeId, PageRequest.of(0, limit));
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
	    public List<InOutSummaryDto> getInOutSummary(LocalDateTime from, LocalDateTime to, Long storeIdParam) {
        // Debug: Log tham số đầu vào
        System.out.println("=== getInOutSummary called ===");
        System.out.println("From: " + from + " (" + from.toLocalDate() + ")");
        System.out.println("To: " + to + " (" + to.toLocalDate() + ")");
        System.out.println("StoreIdParam: " + storeIdParam);
        
        // 1. Lấy tồn đầu trước ngày from - Sử dụng updated_at để nhất quán
        Integer openingStock = 0;
        Long storeIdFilter = (storeIdParam != null) ? storeIdParam : getCurrentUserStoreIdIfStaff();
        // Chỉ lấy sản phẩm từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<ImportTransactionDetail> allDetails = importTransactionDetailRepository.findByRemainQuantityGreaterThanAndImportTransactionStatus(0, ImportTransactionStatus.COMPLETE);
        
        System.out.println("Calculating opening stock before " + from.toLocalDate() + " from " + allDetails.size() + " active details");
        
        for (ImportTransactionDetail detail : allDetails) {
			if (storeIdFilter != null) {
				if (detail.getProduct() == null || detail.getProduct().getStore() == null || !storeIdFilter.equals(detail.getProduct().getStore().getId())) {
					continue;
				}
			}
            ImportTransaction importTransaction = detail.getImportTransaction();
            if (importTransaction != null) {
                // Sử dụng updated_at làm ngày chính, fallback sang import_date
                LocalDateTime transactionDateTime = importTransaction.getUpdatedAt();
                if (transactionDateTime == null) {
                    transactionDateTime = importTransaction.getImportDate();
                }
                
                if (transactionDateTime != null && transactionDateTime.isBefore(from)) {
                    openingStock += detail.getRemainQuantity() != null ? detail.getRemainQuantity() : 0;
                }
            }
        }
        
        System.out.println("Opening stock calculated: " + openingStock);

        // 2. Chuẩn bị map ngày -> summary
        TreeMap<LocalDate, InOutSummaryDto> summaryMap = new TreeMap<>();
        LocalDate cursor = from.toLocalDate();
        LocalDate end = to.toLocalDate();
        while (!cursor.isAfter(end)) {
            summaryMap.put(cursor, new InOutSummaryDto(cursor, 0, 0, 0));
            cursor = cursor.plusDays(1);
        }

        // 3. Tổng hợp nhập kho từng ngày - Sử dụng updated_at để nhất quán với xuất kho
		List<ImportTransaction> importList = (storeIdFilter != null)
				? importTransactionRepository.findAllImportActiveByStore(storeIdFilter)
				: importTransactionRepository.findAllImportActive();
        
        System.out.println("Found " + importList.size() + " active import transactions");
        
        for (ImportTransaction imp : importList) {
            // Chỉ tính nhập kho từ các phiếu nhập đã hoàn thành (COMPLETE status)
            if (imp.getStatus() != ImportTransactionStatus.COMPLETE) {
                System.out.println("  Import ID: " + imp.getId() + " - SKIPPED: Status is " + imp.getStatus() + " (not COMPLETE)");
                continue;
            }
            
            // Sử dụng updated_at làm ngày chính để phản ánh thời gian thực tế của giao dịch
            LocalDateTime transactionDateTime = imp.getUpdatedAt();
            if (transactionDateTime == null) {
                // Fallback: nếu updated_at null, sử dụng import_date
                transactionDateTime = imp.getImportDate();
                System.out.println("  Updated_at is null for import ID: " + imp.getId() + ", using import_date: " + transactionDateTime);
            }
            
            if (transactionDateTime == null) {
                System.out.println("  No valid date found for import ID: " + imp.getId());
                continue;
            }
            
            LocalDate date = transactionDateTime.toLocalDate();
            
            // Debug: Log thông tin ngày để kiểm tra logic lọc
            System.out.println("  Import ID: " + imp.getId() + " - Updated_at: " + imp.getUpdatedAt() + " -> Using: " + transactionDateTime + " -> Date: " + date);
            
            if (date.isBefore(from.toLocalDate()) || date.isAfter(to.toLocalDate())) {
                System.out.println("  -> SKIPPED: Date out of range");
                continue;
            }
            
            int total = 0;
            if (imp.getDetails() != null) {
                for (ImportTransactionDetail d : imp.getDetails()) {
                    total += d.getImportQuantity() != null ? d.getImportQuantity() : 0;
                }
            }
            
            System.out.println("  Import total for " + date + ": " + total);
            
            InOutSummaryDto dto = summaryMap.get(date);
            if (dto != null) dto.setImportQuantity(dto.getImportQuantity() + total);
        }

        // 4. Tổng hợp xuất kho từng ngày - Sử dụng updated_at thay vì sale_date
		List<SaleTransaction> saleList = (storeIdFilter != null)
				? saleTransactionRepository.findAllSaleActiveByStore(storeIdFilter)
				: saleTransactionRepository.findAllSaleActive();
        
        // Debug: Log số lượng phiếu bán tìm thấy
        System.out.println("Found " + saleList.size() + " active sale transactions");
        if (storeIdFilter != null) {
            System.out.println("Filtering by store ID: " + storeIdFilter);
        }
        
        ObjectMapper objectMapper = new ObjectMapper();
        // Cấu hình ObjectMapper để xử lý LocalDateTime
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        for (SaleTransaction sale : saleList) {
            // Sử dụng updated_at làm ngày chính để phản ánh thời gian thực tế của giao dịch
            LocalDateTime transactionDateTime = sale.getUpdatedAt();
            if (transactionDateTime == null) {
                // Fallback: nếu updated_at null, sử dụng created_at
                transactionDateTime = sale.getCreatedAt();
                System.out.println("  Updated_at is null for sale ID: " + sale.getId() + ", using created_at: " + transactionDateTime);
            }
            
            if (transactionDateTime == null) {
                System.out.println("  No valid date found for sale ID: " + sale.getId());
                continue;
            }
            
            LocalDate date = transactionDateTime.toLocalDate();
            
            // Debug: Log thông tin ngày để kiểm tra logic lọc
            System.out.println("  Sale ID: " + sale.getId() + " - Updated_at: " + sale.getUpdatedAt() + " -> Using: " + transactionDateTime + " -> Date: " + date);
            System.out.println("  Date comparison: " + date + " isBefore(" + from.toLocalDate() + ") = " + date.isBefore(from.toLocalDate()));
            System.out.println("  Date comparison: " + date + " isAfter(" + to.toLocalDate() + ") = " + date.isAfter(to.toLocalDate()));
            
            if (date.isBefore(from.toLocalDate()) || date.isAfter(to.toLocalDate())) {
                System.out.println("  -> SKIPPED: Date out of range");
                continue;
            }
            
            // Debug: Log thông tin phiếu bán
            System.out.println("Processing sale ID: " + sale.getId() + ", Name: " + sale.getName() + 
                             ", Updated_at: " + sale.getUpdatedAt() + ", Date: " + date + 
                             ", Detail length: " + (sale.getDetail() != null ? sale.getDetail().length() : 0) +
                             ", Store: " + (sale.getStore() != null ? sale.getStore().getId() : "null"));
            
            int total = 0;
            if (sale.getDetail() != null && !sale.getDetail().isEmpty()) {
                try {
                    List<ProductSaleResponseDto> details = objectMapper.readValue(
                            sale.getDetail(), new TypeReference<List<ProductSaleResponseDto>>() {
                            });
                    for (ProductSaleResponseDto d : details) {
                        // Lấy số lượng xuất từ trường quantity, nếu không có thì dùng remainQuantity
                        Integer quantity = d.getQuantity();
                        if (quantity == null || quantity == 0) {
                            // Fallback: nếu không có quantity, có thể đây là dữ liệu cũ
                            // hoặc dữ liệu từ stocktake, thử lấy từ remainQuantity
                            quantity = d.getRemainQuantity();
                        }
                        if (quantity != null && quantity > 0) {
                            total += quantity;
                            // Debug: Log số lượng từng sản phẩm
                            System.out.println("  - Product: " + d.getProductName() + " (" + d.getProductCode() + 
                                             "), Quantity: " + d.getQuantity() + ", RemainQuantity: " + d.getRemainQuantity() + 
                                             ", Using: " + quantity);
                        } else {
                            System.out.println("  - Product: " + d.getProductName() + " (" + d.getProductCode() + 
                                             "), Quantity: " + d.getQuantity() + ", RemainQuantity: " + d.getRemainQuantity() + 
                                             " - SKIPPED (no valid quantity)");
                        }
                    }
                } catch (Exception e) {
                    // Log lỗi parse JSON để debug
                    System.err.println("Error parsing sale detail JSON for sale ID " + sale.getId() + ": " + e.getMessage());
                    System.err.println("Raw detail: " + sale.getDetail());
                }
            }
            InOutSummaryDto dto = summaryMap.get(date);
            if (dto != null) {
                dto.setExportQuantity(dto.getExportQuantity() + total);
                // Debug: Log tổng số lượng xuất cho ngày này
                System.out.println("  Total export for " + date + ": " + total + " (cumulative: " + dto.getExportQuantity() + ")");
            }
        }

        // 5. Tính tồn cuối mỗi ngày
        System.out.println("=== Final Summary ===");
        int remain = openingStock;
        for (InOutSummaryDto dto : summaryMap.values()) {
            remain += dto.getImportQuantity() - dto.getExportQuantity();
            dto.setRemainQuantity(remain);
            System.out.println("Date: " + dto.getDate() + 
                             " | Import: " + dto.getImportQuantity() + 
                             " | Export: " + dto.getExportQuantity() + 
                             " | Remain: " + dto.getRemainQuantity());
        }
        System.out.println("=== End Summary ===");
        return new ArrayList<>(summaryMap.values());
    }

    @Override
    public List<CategoryRemainSummaryDto> getRemainSummary() {
        // Chỉ lấy sản phẩm từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<ImportTransactionDetail> details = importTransactionDetailRepository.findByRemainQuantityGreaterThanAndImportTransactionStatus(0, ImportTransactionStatus.COMPLETE);
        Map<String, CategoryRemainSummaryDto> categoryMap = new HashMap<>();
        Map<Long, Product> productMap = productRepository.findAll().stream().collect(Collectors.toMap(Product::getId, p -> p));
        Map<String, Zone> zoneMap = zoneRepository.findAll().stream().collect(Collectors.toMap(z -> z.getId().toString(), z -> z));

        Long storeIdFilter = getCurrentUserStoreIdIfStaff();

        for (ImportTransactionDetail d : details) {
            if (d.getProduct() == null || d.getProduct().getCategory() == null) continue;
            if (storeIdFilter != null) {
                if (d.getProduct().getStore() == null || !storeIdFilter.equals(d.getProduct().getStore().getId())) continue;
            }
            String categoryName = d.getProduct().getCategory().getCategoryName();
            Long productId = d.getProduct().getId();
            String productName = d.getProduct().getProductName();
            Integer remain = d.getRemainQuantity() != null ? d.getRemainQuantity() : 0;
            String zoneId = d.getZones_id();

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

            // Zone(s)
            List<String> zoneIds = new ArrayList<>();
            if (zoneId != null && !zoneId.isBlank()) {
                String[] parts = zoneId.split("[;,|\\s]+");
                for (String p : parts) {
                    if (p != null && !p.isBlank()) zoneIds.add(p.trim());
                }
            }
            if (zoneIds.isEmpty()) {
                ZoneRemainSummaryDto zoneDto = prodDto.getZones().stream().filter(z -> Objects.equals(z.getZoneId(), "-")).findFirst().orElse(null);
                if (zoneDto == null) {
                    zoneDto = new ZoneRemainSummaryDto("-", "-", 0);
                    prodDto.getZones().add(zoneDto);
                }
                zoneDto.setTotalRemain(zoneDto.getTotalRemain() + remain);
            } else {
                int n = zoneIds.size();
                int base = remain / n;
                int extra = remain % n;
                for (int i = 0; i < n; i++) {
                    String zid = zoneIds.get(i);
                    Zone zoneObj = zoneMap.get(zid);
                    String zName = zoneObj != null ? zoneObj.getZoneName() : zid;
                    ZoneRemainSummaryDto zoneDto = prodDto.getZones().stream().filter(z -> Objects.equals(z.getZoneId(), zid)).findFirst().orElse(null);
                    if (zoneDto == null) {
                        zoneDto = new ZoneRemainSummaryDto(zid, zName, 0);
                        prodDto.getZones().add(zoneDto);
                    }
                    int add = base + (i < extra ? 1 : 0);
                    zoneDto.setTotalRemain(zoneDto.getTotalRemain() + add);
                }
            }
        }
        return new ArrayList<>(categoryMap.values());
    }

    @Override
    public List<CategoryRemainSummaryDto> getRemainSummary(Long storeId) {
        if (storeId == null) {
            return getRemainSummary();
        }

        // Chỉ lấy sản phẩm từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<ImportTransactionDetail> details = importTransactionDetailRepository.findByRemainQuantityGreaterThanAndImportTransactionStatus(0, ImportTransactionStatus.COMPLETE);
        Map<String, CategoryRemainSummaryDto> categoryMap = new HashMap<>();
        Map<Long, Product> productMap = productRepository.findAll().stream().collect(Collectors.toMap(Product::getId, p -> p));
        Map<String, Zone> zoneMap = zoneRepository.findAll().stream().collect(Collectors.toMap(z -> z.getId().toString(), z -> z));

        for (ImportTransactionDetail d : details) {
            if (d.getProduct() == null || d.getProduct().getCategory() == null) continue;

            // Filter by store
            if (d.getProduct().getStore() == null || !storeId.equals(d.getProduct().getStore().getId())) continue;

            String categoryName = d.getProduct().getCategory().getCategoryName();
            Long productId = d.getProduct().getId();
            String productName = d.getProduct().getProductName();
            Integer remain = d.getRemainQuantity() != null ? d.getRemainQuantity() : 0;
            String zoneId = d.getZones_id();

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

            // Zone(s)
            List<String> zoneIds = new ArrayList<>();
            if (zoneId != null && !zoneId.isBlank()) {
                String[] parts = zoneId.split("[;,|\\s]+");
                for (String p : parts) {
                    if (p != null && !p.isBlank()) zoneIds.add(p.trim());
                }
            }
            if (zoneIds.isEmpty()) {
                ZoneRemainSummaryDto zoneDto = prodDto.getZones().stream().filter(z -> Objects.equals(z.getZoneId(), "-")).findFirst().orElse(null);
                if (zoneDto == null) {
                    zoneDto = new ZoneRemainSummaryDto("-", "-", 0);
                    prodDto.getZones().add(zoneDto);
                }
                zoneDto.setTotalRemain(zoneDto.getTotalRemain() + remain);
            } else {
                int n = zoneIds.size();
                int base = remain / n;
                int extra = remain % n;
                for (int i = 0; i < n; i++) {
                    String zid = zoneIds.get(i);
                    Zone zoneObj = zoneMap.get(zid);
                    String zName = zoneObj != null ? zoneObj.getZoneName() : zid;
                    ZoneRemainSummaryDto zoneDto = prodDto.getZones().stream().filter(z -> Objects.equals(z.getZoneId(), zid)).findFirst().orElse(null);
                    if (zoneDto == null) {
                        zoneDto = new ZoneRemainSummaryDto(zid, zName, 0);
                        prodDto.getZones().add(zoneDto);
                    }
                    int add = base + (i < extra ? 1 : 0);
                    zoneDto.setTotalRemain(zoneDto.getTotalRemain() + add);
                }
            }
        }
        return new ArrayList<>(categoryMap.values());
    }

    // --- New implementations ---
    @Override
    public DailyRevenueDto getDailyRevenue(LocalDateTime from, LocalDateTime to, Long storeIdParam) {
        Long storeId = (storeIdParam != null) ? storeIdParam : getCurrentUserStoreIdIfStaff();
        BigDecimal saleSum = BigDecimal.ZERO;
        BigDecimal importSum = BigDecimal.ZERO;

        List<SaleTransaction> sales = (storeId != null)
                ? saleTransactionRepository.findAllSaleActiveByStore(storeId)
                : saleTransactionRepository.findAllSaleActive();
        for (SaleTransaction s : sales) {
            if (s.getSaleDate() == null || s.getTotalAmount() == null) continue;
            if (!s.getSaleDate().isBefore(from) && !s.getSaleDate().isAfter(to)) {
                saleSum = saleSum.add(s.getTotalAmount());
            }
        }

        List<ImportTransaction> imports = (storeId != null)
                ? importTransactionRepository.findAllImportActiveByStore(storeId)
                : importTransactionRepository.findAllImportActive();
        for (ImportTransaction i : imports) {
            if (i.getImportDate() == null || i.getTotalAmount() == null) continue;
            if (!i.getImportDate().isBefore(from) && !i.getImportDate().isAfter(to)) {
                importSum = importSum.add(i.getTotalAmount());
            }
        }

        DailyRevenueDto dto = new DailyRevenueDto();
        dto.setTotalSaleAmount(saleSum);
        dto.setTotalImportAmount(importSum);
        dto.setNetRevenue(saleSum.subtract(importSum));
        return dto;
    }

    @Override
    public List<SalesShiftTotalDto> getSalesTotal(LocalDateTime from, LocalDateTime to, String groupBy, Long storeIdParam, Long cashierId) {
        Long storeId = (storeIdParam != null) ? storeIdParam : getCurrentUserStoreIdIfStaff();
        Map<String, SalesShiftTotalDto> map = new TreeMap<>();
        
        // Lấy danh sách sale transactions
        List<SaleTransaction> sales = (storeId != null)
                ? saleTransactionRepository.findAllSaleActiveByStore(storeId)
                : saleTransactionRepository.findAllSaleActive();
        
        // Debug log
        System.out.println("DEBUG: Found " + sales.size() + " sales for store " + storeId + " between " + from + " and " + to);
        System.out.println("DEBUG: Filter time range - From: " + from + " (Hour: " + from.getHour() + "), To: " + to + " (Hour: " + to.getHour() + ")");
        System.out.println("DEBUG: Current system timezone: " + java.time.ZoneId.systemDefault());
        
        for (SaleTransaction s : sales) {
            // Kiểm tra điều kiện cơ bản
            if (s.getSaleDate() == null || s.getTotalAmount() == null) {
                System.out.println("DEBUG: Skipping sale " + s.getId() + " - missing date or amount");
                continue;
            }
            
            // Debug: Log thời gian thực tế của sale
            System.out.println("DEBUG: Sale " + s.getId() + " - SaleDate: " + s.getSaleDate() + 
                             " (Hour: " + s.getSaleDate().getHour() + 
                             ", Minute: " + s.getSaleDate().getMinute() + 
                             ", Day: " + s.getSaleDate().getDayOfMonth() + 
                             ", Month: " + s.getSaleDate().getMonthValue() + ")");
            System.out.println("DEBUG: Sale " + s.getId() + " - CreatedAt: " + s.getCreatedAt() + 
                             " (Hour: " + s.getCreatedAt().getHour() + 
                             ", Minute: " + s.getCreatedAt().getMinute() + 
                             ", Day: " + s.getCreatedAt().getDayOfMonth() + 
                             ", Month: " + s.getCreatedAt().getMonthValue() + ")");
            
            // SỬA: Sử dụng createdAt thay vì saleDate để khớp với bảng hiển thị
            LocalDateTime transactionTime = s.getCreatedAt() != null ? s.getCreatedAt() : s.getSaleDate();
            
            // Kiểm tra khoảng thời gian
            if (transactionTime.isBefore(from) || transactionTime.isAfter(to)) {
                System.out.println("DEBUG: Skipping sale " + s.getId() + " - date " + transactionTime + " out of range");
                continue;
            }
            
            // Kiểm tra cashier nếu có filter
            if (cashierId != null && !Objects.equals(s.getCreatedBy(), cashierId)) {
                System.out.println("DEBUG: Skipping sale " + s.getId() + " - cashier mismatch: " + s.getCreatedBy() + " vs " + cashierId);
                continue;
            }

            // Tạo key phân nhóm dựa trên groupBy - SỬA: sử dụng transactionTime
            String key = createGroupKey(transactionTime, s.getCreatedBy(), groupBy);
            
            // Tổng hợp dữ liệu
            SalesShiftTotalDto dto = map.computeIfAbsent(key, k -> new SalesShiftTotalDto());
            dto.setLabel(key);
            dto.setTotalAmount(dto.getTotalAmount() == null ? s.getTotalAmount() : dto.getTotalAmount().add(s.getTotalAmount()));
            dto.setOrderCount(dto.getOrderCount() == null ? 1L : dto.getOrderCount() + 1);
            if (dto.getCashierId() == null) dto.setCashierId(s.getCreatedBy());
            
            // Debug log
            System.out.println("DEBUG: Added sale " + s.getId() + " to group '" + key + "' - amount: " + s.getTotalAmount());
        }
        
        // Debug log kết quả
        System.out.println("DEBUG: Final result has " + map.size() + " groups");
        for (Map.Entry<String, SalesShiftTotalDto> entry : map.entrySet()) {
            System.out.println("DEBUG: Group '" + entry.getKey() + "' - Total: " + entry.getValue().getTotalAmount() + ", Orders: " + entry.getValue().getOrderCount());
        }
        
        return new ArrayList<>(map.values());
    }
    
    /**
     * Tạo key phân nhóm dựa trên loại groupBy
     */
    private String createGroupKey(LocalDateTime saleDate, Long cashierId, String groupBy) {
        switch (groupBy.toLowerCase()) {
            case "hour":
                // Nhóm theo giờ: 2025-08-27T08:00:00
                return saleDate.withMinute(0).withSecond(0).withNano(0).toString();
                
            case "cashier":
                // Nhóm theo nhân viên: cashier-5
                return "cashier-" + (cashierId != null ? cashierId : "unknown");
                
            case "shift":
            default:
                // Nhóm theo ca: morning/afternoon/night
                return getShiftName(saleDate.getHour());
        }
    }
    
    /**
     * Xác định tên ca dựa trên giờ
     * Ca sáng: 06:00 - 11:59 (6-11)
     * Ca chiều: 12:00 - 17:59 (12-17)  
     * Ca tối: 18:00 - 05:59 (18-23, 0-5)
     */
    private String getShiftName(int hour) {
        System.out.println("DEBUG: Determining shift for hour: " + hour);
        
        // Sửa logic phân ca để chính xác hơn
        if (hour >= 6 && hour < 12) {
            System.out.println("DEBUG: Hour " + hour + " -> Ca sáng (06:00-12:00)");
            return "Ca sáng (06:00-12:00)";
        } else if (hour >= 12 && hour < 18) {
            System.out.println("DEBUG: Hour " + hour + " -> Ca chiều (12:00-18:00)");
            return "Ca chiều (12:00-18:00)";
        } else if (hour >= 18 || hour < 6) {
            System.out.println("DEBUG: Hour " + hour + " -> Ca tối (18:00-06:00)");
            return "Ca tối (18:00-06:00)";
        } else {
            // Fallback - không bao giờ xảy ra với logic trên
            System.out.println("DEBUG: Hour " + hour + " -> Unknown shift");
            return "Không xác định";
        }
    }

    @Override
    public List<GroupTotalDto> getImportsTotal(LocalDateTime from, LocalDateTime to, String groupBy, Long storeIdParam, Long supplierId) {
        Long storeId = (storeIdParam != null) ? storeIdParam : getCurrentUserStoreIdIfStaff();
        Map<String, GroupTotalDto> map = new TreeMap<>();
        List<ImportTransaction> imports = (storeId != null)
                ? importTransactionRepository.findAllImportActiveByStore(storeId)
                : importTransactionRepository.findAllImportActive();
        for (ImportTransaction i : imports) {
            // Chỉ tính từ các phiếu nhập đã hoàn thành (COMPLETE status)
            if (i.getStatus() != ImportTransactionStatus.COMPLETE) {
                continue;
            }
            if (i.getImportDate() == null || i.getTotalAmount() == null) continue;
            if (i.getImportDate().isBefore(from) || i.getImportDate().isAfter(to)) continue;
            if (supplierId != null && (i.getSupplier() == null || !Objects.equals(i.getSupplier().getId(), supplierId))) continue;

            String key;
            if ("week".equalsIgnoreCase(groupBy)) {
                key = i.getImportDate().getYear() + "-W" + i.getImportDate().get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR);
            } else if ("month".equalsIgnoreCase(groupBy)) {
                key = i.getImportDate().getYear() + "-" + String.format("%02d", i.getImportDate().getMonthValue());
            } else {
                key = i.getImportDate().toLocalDate().toString();
            }

            GroupTotalDto dto = map.computeIfAbsent(key, k -> new GroupTotalDto());
            dto.setBucket(key);
            dto.setTotalAmount(dto.getTotalAmount() == null ? i.getTotalAmount() : dto.getTotalAmount().add(i.getTotalAmount()));
            dto.setCount(dto.getCount() == null ? 1L : dto.getCount() + 1);
            if (i.getSupplier() != null) {
                dto.setEntityId(i.getSupplier().getId());
                dto.setEntityName(i.getSupplier().getName());
            }
        }
        return new ArrayList<>(map.values());
    }

    @Override
    public List<ExpiringLotExtendedDto> getExpiringLotsAdvanced(int days, Long storeIdParam, Long categoryId, Long productId, Boolean includeZeroRemain) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusDays(days);
        Long storeId = (storeIdParam != null) ? storeIdParam : getCurrentUserStoreIdIfStaff();
        // Chỉ lấy expiring lots từ các phiếu nhập đã hoàn thành (COMPLETE status)
        List<ImportTransactionDetail> lots = (storeId != null)
                ? importTransactionDetailRepository.findExpiringLotsCompletedByStore(storeId, now, soon, ImportTransactionStatus.COMPLETE)
                : importTransactionDetailRepository.findExpiringLotsCompleted(now, soon, ImportTransactionStatus.COMPLETE);
        Map<Long, Zone> zoneMapById = zoneRepository.findAll().stream().collect(Collectors.toMap(Zone::getId, z -> z));
        List<ExpiringLotExtendedDto> result = new ArrayList<>();
        for (ImportTransactionDetail lot : lots) {
            if (Boolean.FALSE.equals(includeZeroRemain) && (lot.getRemainQuantity() == null || lot.getRemainQuantity() <= 0)) {
                continue;
            }
            if (categoryId != null) {
                if (lot.getProduct() == null || lot.getProduct().getCategory() == null) continue;
                if (!Objects.equals(lot.getProduct().getCategory().getId(), categoryId)) continue;
            }
            if (productId != null) {
                if (lot.getProduct() == null || !Objects.equals(lot.getProduct().getId(), productId)) continue;
            }
            int daysLeft = lot.getExpireDate() != null ? (int) ChronoUnit.DAYS.between(now, lot.getExpireDate()) : 0;
            String zonesId = lot.getZones_id();
            String zoneNameJoined = null;
            if (zonesId != null && !zonesId.isBlank()) {
                String[] parts = zonesId.split("[;,|\\s]+");
                List<String> names = new ArrayList<>();
                for (String p : parts) {
                    if (p == null || p.isBlank()) continue;
                    try {
                        Long zid = Long.valueOf(p.trim());
                        Zone z = zoneMapById.get(zid);
                        names.add(z != null ? z.getZoneName() : p.trim());
                    } catch (Exception e) {
                        names.add(p.trim());
                    }
                }
                zoneNameJoined = String.join(", ", names);
            }
            ExpiringLotExtendedDto dto = new ExpiringLotExtendedDto(
                    lot.getId(),
                    lot.getProduct() != null ? lot.getProduct().getProductCode() : null,
                    lot.getProduct() != null ? lot.getProduct().getProductName() : null,
                    lot.getName(),
                    zoneNameJoined,
                    lot.getExpireDate(),
                    daysLeft,
                    lot.getProduct() != null && lot.getProduct().getCategory() != null ? lot.getProduct().getCategory().getId() : null,
                    lot.getProduct() != null && lot.getProduct().getCategory() != null ? lot.getProduct().getCategory().getCategoryName() : null,
                    lot.getProduct() != null && lot.getProduct().getStore() != null ? lot.getProduct().getStore().getId() : null,
                    lot.getProduct() != null && lot.getProduct().getStore() != null ? lot.getProduct().getStore().getStoreName() : null,
                    lot.getRemainQuantity()
            );
            result.add(dto);
        }
        return result;
    }
}
