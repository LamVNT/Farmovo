package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.ProductRemainDto;
import com.farmovo.backend.dto.response.RevenueTrendDto;
import com.farmovo.backend.dto.response.StockByCategoryDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.TopProductDto;
import com.farmovo.backend.dto.response.TopCustomerDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.services.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @Autowired
    private ReportService reportService;

    @GetMapping("/remain-by-product")
    public List<ProductRemainDto> getRemainByProduct() {
        return reportService.getRemainByProduct();
    }

    @GetMapping("/stocktake-diff")
    public List<StocktakeDetailDto> getStocktakeDiff() {
        return reportService.getStocktakeDiff();
    }

    @GetMapping("/expiring-lots")
    public List<ImportTransactionDetail> getExpiringLots(@RequestParam(defaultValue = "7") int days) {
        return reportService.getExpiringLots(days);
    }

    @GetMapping("/revenue-trend")
    public List<RevenueTrendDto> getRevenueTrend(
        @RequestParam String type,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        return reportService.getRevenueTrend(type, fromDateTime, toDateTime);
    }

    @GetMapping("/stock-by-category")
    public List<StockByCategoryDto> getStockByCategory() {
        return reportService.getStockByCategory();
    }

    @GetMapping("/top-products")
    public List<TopProductDto> getTopProducts(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "5") int limit
    ) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        return reportService.getTopProducts(fromDateTime, toDateTime, limit);
    }

    @GetMapping("/top-customers")
    public List<TopCustomerDto> getTopCustomers(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(defaultValue = "5") int limit
    ) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        return reportService.getTopCustomers(fromDateTime, toDateTime, limit);
    }
} 