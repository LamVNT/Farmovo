package com.farmovo.backend.services;

import com.farmovo.backend.dto.response.ProductRemainDto;
import com.farmovo.backend.dto.response.StocktakeDetailDto;
import com.farmovo.backend.dto.response.RevenueTrendDto;
import com.farmovo.backend.dto.response.StockByCategoryDto;
import com.farmovo.backend.dto.response.TopProductDto;
import com.farmovo.backend.dto.response.TopCustomerDto;
import com.farmovo.backend.models.ImportTransactionDetail;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface ReportService {
    List<ProductRemainDto> getRemainByProduct();

    List<StocktakeDetailDto> getStocktakeDiff();

    List<ImportTransactionDetail> getExpiringLots(int days);

    List<RevenueTrendDto> getRevenueTrend(String type, LocalDateTime from, LocalDateTime to);
    List<StockByCategoryDto> getStockByCategory();
    List<TopProductDto> getTopProducts(LocalDateTime from, LocalDateTime to, int limit);
    List<TopCustomerDto> getTopCustomers(LocalDateTime from, LocalDateTime to, int limit);
} 