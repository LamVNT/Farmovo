package com.farmovo.backend.controller;

import com.farmovo.backend.dto.response.ProductRemainDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.models.ImportTransactionDetail;
import com.farmovo.backend.services.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
} 