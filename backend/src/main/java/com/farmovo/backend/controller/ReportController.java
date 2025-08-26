package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.*;
import com.farmovo.backend.dto.response.CategoryRemainSummaryDto;
import com.farmovo.backend.dto.response.ExpiringLotDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.services.ReportService;
import com.farmovo.backend.services.BalanceStockService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.util.List;

import com.farmovo.backend.services.impl.JwtAuthenticationService;
import com.farmovo.backend.models.User;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired
    private ReportService reportService;
    @Autowired
    private BalanceStockService balanceStockService;
    @Autowired
    private JwtAuthenticationService jwtAuthenticationService;

    @GetMapping("/remain-by-product")
    public List<ProductRemainDto> getRemainByProduct(@RequestParam(required = false) Long storeId) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(null);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }
        return reportService.getRemainByProduct(storeId);
    }

    @GetMapping("/stocktake-diff")
    public List<StocktakeDetailDto> getStocktakeDiff(@RequestParam(value = "stocktakeId", required = false) Long stocktakeId) {
        return reportService.getStocktakeDiffById(stocktakeId);
    }

    @GetMapping("/stocktake-diff/{stocktakeId}")
    public List<StocktakeDetailDto> getStocktakeDiffById(@PathVariable Long stocktakeId) {
        return reportService.getStocktakeDiffById(stocktakeId);
    }

    @GetMapping("/stocktake-diff-for-balance")
    public List<ProductSaleResponseDto> getStocktakeDiffForBalance(@RequestParam(value = "stocktakeId", required = false) Long stocktakeId) {
        List<StocktakeDetailDto> stocktakeDetails = reportService.getStocktakeDiffById(stocktakeId);
        return balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);
    }

    @GetMapping("/stocktake-diff-for-balance/{stocktakeId}")
    public List<ProductSaleResponseDto> getStocktakeDiffForBalanceById(@PathVariable Long stocktakeId) {
        List<StocktakeDetailDto> stocktakeDetails = reportService.getStocktakeDiffById(stocktakeId);
        return balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails);
    }

    @GetMapping("/expiring-lots")
    public List<ExpiringLotDto> getExpiringLots(@RequestParam(defaultValue = "7") int days,
                                                @RequestParam(required = false) Long storeId) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(null);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }
        return reportService.getExpiringLots(days, storeId);
    }

    @GetMapping("/revenue-trend")
    public List<RevenueTrendDto> getRevenueTrend(
            @RequestParam String type,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long storeId,
            HttpServletRequest request
    ) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(request);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }

        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        return reportService.getRevenueTrend(type, fromDateTime, toDateTime, storeId);
    }

    @GetMapping("/stock-by-category")
    public List<StockByCategoryDto> getStockByCategory(
            @RequestParam(required = false) Long storeId,
            HttpServletRequest request
    ) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(request);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }

        return reportService.getStockByCategory(storeId);
    }

    @GetMapping("/top-products")
    public List<TopProductDto> getTopProducts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) Long storeId,
            HttpServletRequest request
    ) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(request);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }

        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        return reportService.getTopProducts(fromDateTime, toDateTime, limit, storeId);
    }

    @GetMapping("/top-customers")
    public List<TopCustomerDto> getTopCustomers(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "5") int limit,
            @RequestParam(required = false) Long storeId,
            HttpServletRequest request
    ) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(request);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }

        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        return reportService.getTopCustomers(fromDateTime, toDateTime, limit, storeId);
    }

    @GetMapping("/remain-by-product-advanced")
    public List<RemainByProductReportDto> getRemainByProductAdvanced(
            @RequestParam(required = false) String zoneId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String status
    ) {
        return reportService.getRemainByProductAdvanced(zoneId, categoryId, status);
    }


    @GetMapping("/inout-summary")
    public List<InOutSummaryDto> getInOutSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long storeId
    ) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(null);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }
        return reportService.getInOutSummary(fromDateTime, toDateTime, storeId);
    }

    @GetMapping("/remain-summary")
    public List<CategoryRemainSummaryDto> getRemainSummary(
            @RequestParam(required = false) Long storeId,
            HttpServletRequest request
    ) {
        // Nếu không có storeId parameter, sử dụng method gốc (đã có logic phân quyền)
        if (storeId == null) {
            return reportService.getRemainSummary();
        }

        // Nếu có storeId parameter, kiểm tra quyền trước
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(request);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                // Staff chỉ được xem kho của mình
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {}

        return reportService.getRemainSummary(storeId);
    }

    // --- New endpoints ---
    @GetMapping("/daily-revenue")
    public DailyRevenueDto getDailyRevenue(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long storeId
    ) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(null);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }
        return reportService.getDailyRevenue(fromDateTime, toDateTime, storeId);
    }

    @GetMapping("/sales-total")
    public List<SalesShiftTotalDto> getSalesTotal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "shift") String groupBy,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long cashierId
    ) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(null);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }
        return reportService.getSalesTotal(from, to, groupBy, storeId, cashierId);
    }

    @GetMapping("/imports-total")
    public List<GroupTotalDto> getImportsTotal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "day") String groupBy,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long supplierId
    ) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(null);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }
        return reportService.getImportsTotal(fromDateTime, toDateTime, groupBy, storeId, supplierId);
    }

    @GetMapping("/expiring-lots-advanced")
    public List<ExpiringLotExtendedDto> getExpiringLotsAdvanced(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(required = false) Long storeId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false, defaultValue = "false") Boolean includeZeroRemain
    ) {
        try {
            User user = jwtAuthenticationService.extractAuthenticatedUser(null);
            var roles = jwtAuthenticationService.getUserRoles(user);
            if (roles.contains("STAFF") && user != null && user.getStore() != null) {
                storeId = user.getStore().getId();
            }
        } catch (Exception ignored) {
        }
        return reportService.getExpiringLotsAdvanced(days, storeId, categoryId, productId, includeZeroRemain);
    }
} 