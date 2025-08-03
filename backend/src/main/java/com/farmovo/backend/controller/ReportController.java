package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.*;
import com.farmovo.backend.dto.response.CategoryRemainSummaryDto;
import com.farmovo.backend.dto.response.ExpiringLotDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.services.ReportService;

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
    public List<StocktakeDetailDto> getStocktakeDiff(@RequestParam(value = "stocktakeId", required = false) Long stocktakeId) {
        return reportService.getStocktakeDiffById(stocktakeId);
    }
    @GetMapping("/stocktake-diff/{stocktakeId}")
    public List<StocktakeDetailDto> getStocktakeDiffById(@PathVariable Long stocktakeId) {
        return reportService.getStocktakeDiffById(stocktakeId);
    }

    @GetMapping("/expiring-lots")
    public List<ExpiringLotDto> getExpiringLots(@RequestParam(defaultValue = "7") int days) {
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
        return reportService.getInOutSummary(fromDateTime, toDateTime);
    }

    @GetMapping("/remain-summary")
    public List<CategoryRemainSummaryDto> getRemainSummary() {
        return reportService.getRemainSummary();
    }
} 