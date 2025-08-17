package com.farmovo.backend.services;

import com.farmovo.backend.dto.response.*;
import com.farmovo.backend.models.ImportTransactionDetail;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface ReportService {
    List<ProductRemainDto> getRemainByProduct(Long storeId);

    List<StocktakeDetailDto> getStocktakeDiff();

    List<StocktakeDetailDto> getStocktakeDiffById(Long stocktakeId);

    List<ExpiringLotDto> getExpiringLots(int days, Long storeId);

    List<RevenueTrendDto> getRevenueTrend(String type, LocalDateTime from, LocalDateTime to);

    List<StockByCategoryDto> getStockByCategory();

    List<TopProductDto> getTopProducts(LocalDateTime from, LocalDateTime to, int limit);

    List<TopCustomerDto> getTopCustomers(LocalDateTime from, LocalDateTime to, int limit);

    List<RemainByProductReportDto> getRemainByProductAdvanced(String zoneId, Long categoryId, String status);

    List<InOutSummaryDto> getInOutSummary(LocalDateTime from, LocalDateTime to, Long storeId);

    List<CategoryRemainSummaryDto> getRemainSummary();

    // --- New reports ---
    DailyRevenueDto getDailyRevenue(LocalDateTime from, LocalDateTime to, Long storeId);

    List<SalesShiftTotalDto> getSalesTotal(LocalDateTime from, LocalDateTime to, String groupBy, Long storeId, Long cashierId);

    List<GroupTotalDto> getImportsTotal(LocalDateTime from, LocalDateTime to, String groupBy, Long storeId, Long supplierId);

    List<ExpiringLotExtendedDto> getExpiringLotsAdvanced(int days, Long storeId, Long categoryId, Long productId, Boolean includeZeroRemain);
} 