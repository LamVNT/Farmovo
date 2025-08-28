//package com.farmovo.backend.controller;
//
//import com.farmovo.backend.dto.response.*;
//import com.farmovo.backend.exceptions.GlobalExceptionHandler;
//import com.farmovo.backend.services.BalanceStockService;
//import com.farmovo.backend.services.ReportService;
//import com.farmovo.backend.services.impl.JwtAuthenticationService;
//import com.farmovo.backend.models.User;
//import com.farmovo.backend.models.Store;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.test.web.servlet.MockMvc;
//import org.springframework.test.web.servlet.setup.MockMvcBuilders;
//
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.time.LocalTime;
//import java.util.Arrays;
//import java.util.List;
//
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//@ExtendWith(MockitoExtension.class)
//class ReportControllerTest {
//
//    @Mock
//    private ReportService reportService;
//
//    @Mock
//    private BalanceStockService balanceStockService;
//
//    @Mock
//    private JwtAuthenticationService jwtAuthenticationService;
//
//    @InjectMocks
//    private ReportController reportController;
//
//    private MockMvc mockMvc;
//
//    private User validUser;
//    private Store validStore;
//
//    @BeforeEach
//    void setup() {
//        mockMvc = MockMvcBuilders.standaloneSetup(reportController)
//                .setControllerAdvice(new GlobalExceptionHandler())
//                .build();
//
//        // Setup test data
//        validStore = new Store();
//        validStore.setId(1L);
//        validStore.setStoreName("Store A");
//
//        validUser = new User();
//        validUser.setId(1L);
//        validUser.setStore(validStore);
//    }
//
//    // Test getRemainByProduct
//    @Test
//    void getRemainByProduct_success() throws Exception {
//        ProductRemainDto productRemain = new ProductRemainDto(1L, 100);
//        List<ProductRemainDto> expectedResult = Arrays.asList(productRemain);
//
//        when(reportService.getRemainByProduct(any())).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/remain-by-product"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].productId").value(1L))
//                .andExpect(jsonPath("$[0].remainQuantity").value(100));
//    }
//
//    @Test
//    void getRemainByProduct_withStoreId_success() throws Exception {
//        ProductRemainDto productRemain = new ProductRemainDto(1L, 100);
//        List<ProductRemainDto> expectedResult = Arrays.asList(productRemain);
//
//        when(reportService.getRemainByProduct(1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/remain-by-product")
//                        .param("storeId", "1"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].productId").value(1L));
//    }
//
//    @Test
//    void getRemainByProduct_staffRole_shouldUseUserStore() throws Exception {
//        when(jwtAuthenticationService.extractAuthenticatedUser(any())).thenReturn(validUser);
//        when(jwtAuthenticationService.getUserRoles(validUser)).thenReturn(Arrays.asList("STAFF"));
//
//        ProductRemainDto productRemain = new ProductRemainDto(1L, 100);
//        List<ProductRemainDto> expectedResult = Arrays.asList(productRemain);
//
//        when(reportService.getRemainByProduct(1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/remain-by-product"))
//                .andExpect(status().isOk());
//    }
//
//    // Test getStocktakeDiff
//    @Test
//    void getStocktakeDiff_success() throws Exception {
//        StocktakeDetailDto detail = new StocktakeDetailDto();
//        detail.setId(1L);
//        detail.setDiff(-5);
//        List<StocktakeDetailDto> expectedResult = Arrays.asList(detail);
//
//        when(reportService.getStocktakeDiffById(any())).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/stocktake-diff"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].id").value(1L));
//    }
//
//    @Test
//    void getStocktakeDiff_withStocktakeId_success() throws Exception {
//        StocktakeDetailDto detail = new StocktakeDetailDto();
//        detail.setId(1L);
//        detail.setDiff(-5);
//        List<StocktakeDetailDto> expectedResult = Arrays.asList(detail);
//
//        when(reportService.getStocktakeDiffById(1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/stocktake-diff")
//                        .param("stocktakeId", "1"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].id").value(1L));
//    }
//
//    @Test
//    void getStocktakeDiffById_success() throws Exception {
//        StocktakeDetailDto detail = new StocktakeDetailDto();
//        detail.setId(1L);
//        detail.setDiff(-5);
//        List<StocktakeDetailDto> expectedResult = Arrays.asList(detail);
//
//        when(reportService.getStocktakeDiffById(1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/stocktake-diff/1"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].id").value(1L));
//    }
//
//    // Test getStocktakeDiffForBalance
//    @Test
//    void getStocktakeDiffForBalance_success() throws Exception {
//        StocktakeDetailDto detail = new StocktakeDetailDto();
//        detail.setId(1L);
//        detail.setDiff(-5);
//        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(detail);
//
//        ProductSaleResponseDto productSale = new ProductSaleResponseDto();
//        productSale.setId(1L);
//        productSale.setQuantity(5);
//        List<ProductSaleResponseDto> expectedResult = Arrays.asList(productSale);
//
//        when(reportService.getStocktakeDiffById(any())).thenReturn(stocktakeDetails);
//        when(balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/stocktake-diff-for-balance"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].id").value(1L));
//    }
//
//    @Test
//    void getStocktakeDiffForBalanceById_success() throws Exception {
//        StocktakeDetailDto detail = new StocktakeDetailDto();
//        detail.setId(1L);
//        detail.setDiff(-5);
//        List<StocktakeDetailDto> stocktakeDetails = Arrays.asList(detail);
//
//        ProductSaleResponseDto productSale = new ProductSaleResponseDto();
//        productSale.setId(1L);
//        productSale.setQuantity(5);
//        List<ProductSaleResponseDto> expectedResult = Arrays.asList(productSale);
//
//        when(reportService.getStocktakeDiffById(1L)).thenReturn(stocktakeDetails);
//        when(balanceStockService.convertStocktakeDetailToProductSale(stocktakeDetails)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/stocktake-diff-for-balance/1"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].id").value(1L));
//    }
//
//    // Test getExpiringLots
//    @Test
//    void getExpiringLots_success() throws Exception {
//        ExpiringLotDto expiringLot = new ExpiringLotDto();
//        expiringLot.setProductName("Product A");
//        expiringLot.setDaysUntilExpiry(5);
//        List<ExpiringLotDto> expectedResult = Arrays.asList(expiringLot);
//
//        when(reportService.getExpiringLots(7, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/expiring-lots"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].productName").value("Product A"));
//    }
//
//    @Test
//    void getExpiringLots_withCustomDays_success() throws Exception {
//        ExpiringLotDto expiringLot = new ExpiringLotDto();
//        expiringLot.setProductName("Product A");
//        expiringLot.setDaysUntilExpiry(10);
//        List<ExpiringLotDto> expectedResult = Arrays.asList(expiringLot);
//
//        when(reportService.getExpiringLots(10, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/expiring-lots")
//                        .param("days", "10"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].daysUntilExpiry").value(10));
//    }
//
//    @Test
//    void getExpiringLots_staffRole_shouldUseUserStore() throws Exception {
//        when(jwtAuthenticationService.extractAuthenticatedUser(any())).thenReturn(validUser);
//        when(jwtAuthenticationService.getUserRoles(validUser)).thenReturn(Arrays.asList("STAFF"));
//
//        ExpiringLotDto expiringLot = new ExpiringLotDto();
//        expiringLot.setProductName("Product A");
//        List<ExpiringLotDto> expectedResult = Arrays.asList(expiringLot);
//
//        when(reportService.getExpiringLots(7, 1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/expiring-lots"))
//                .andExpect(status().isOk());
//    }
//
//    // Test getRevenueTrend
//    @Test
//    void getRevenueTrend_success() throws Exception {
//        RevenueTrendDto revenueTrend = new RevenueTrendDto();
//        revenueTrend.setLabel("2024-01-01");
//        revenueTrend.setRevenue(new BigDecimal("1000000"));
//        List<RevenueTrendDto> expectedResult = Arrays.asList(revenueTrend);
//
//        LocalDate from = LocalDate.of(2024, 1, 1);
//        LocalDate to = LocalDate.of(2024, 1, 31);
//        LocalDateTime fromDateTime = from.atStartOfDay();
//        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
//
//        when(reportService.getRevenueTrend("day", fromDateTime, toDateTime, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/revenue-trend")
//                        .param("type", "day")
//                        .param("from", "2024-01-01")
//                        .param("to", "2024-01-31"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].label").value("2024-01-01"));
//    }
//
//    @Test
//    void getRevenueTrend_staffRole_shouldUseUserStore() throws Exception {
//        when(jwtAuthenticationService.extractAuthenticatedUser(any())).thenReturn(validUser);
//        when(jwtAuthenticationService.getUserRoles(validUser)).thenReturn(Arrays.asList("STAFF"));
//
//        RevenueTrendDto revenueTrend = new RevenueTrendDto();
//        revenueTrend.setLabel("2024-01-01");
//        revenueTrend.setRevenue(new BigDecimal("1000000"));
//        List<RevenueTrendDto> expectedResult = Arrays.asList(revenueTrend);
//
//        LocalDate from = LocalDate.of(2024, 1, 1);
//        LocalDate to = LocalDate.of(2024, 1, 31);
//        LocalDateTime fromDateTime = from.atStartOfDay();
//        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
//
//        when(reportService.getRevenueTrend("day", fromDateTime, toDateTime, 1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/revenue-trend")
//                        .param("type", "day")
//                        .param("from", "2024-01-01")
//                        .param("to", "2024-01-31"))
//                .andExpect(status().isOk());
//    }
//
//    // Test getStockByCategory
//    @Test
//    void getStockByCategory_success() throws Exception {
//        StockByCategoryDto stockByCategory = new StockByCategoryDto();
//        stockByCategory.setCategory("Category A");
//        stockByCategory.setStock(1000);
//        List<StockByCategoryDto> expectedResult = Arrays.asList(stockByCategory);
//
//        when(reportService.getStockByCategory(null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/stock-by-category"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].category").value("Category A"));
//    }
//
//    @Test
//    void getStockByCategory_staffRole_shouldUseUserStore() throws Exception {
//        when(jwtAuthenticationService.extractAuthenticatedUser(any())).thenReturn(validUser);
//        when(jwtAuthenticationService.getUserRoles(validUser)).thenReturn(Arrays.asList("STAFF"));
//
//        StockByCategoryDto stockByCategory = new StockByCategoryDto();
//        stockByCategory.setCategory("Category A");
//        stockByCategory.setStock(1000);
//        List<StockByCategoryDto> expectedResult = Arrays.asList(stockByCategory);
//
//        when(reportService.getStockByCategory(1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/stock-by-category"))
//                .andExpect(status().isOk());
//    }
//
//    // Test getTopProducts
//    @Test
//    void getTopProducts_success() throws Exception {
//        TopProductDto topProduct = new TopProductDto();
//        topProduct.setProductName("Product A");
//        topProduct.setCategory("Category A");
//        topProduct.setQuantity(100L);
//        List<TopProductDto> expectedResult = Arrays.asList(topProduct);
//
//        LocalDate from = LocalDate.of(2024, 1, 1);
//        LocalDate to = LocalDate.of(2024, 1, 31);
//        LocalDateTime fromDateTime = from.atStartOfDay();
//        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
//
//        when(reportService.getTopProducts(fromDateTime, toDateTime, 5, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/top-products")
//                        .param("from", "2024-01-01")
//                        .param("to", "2024-01-31")
//                        .param("limit", "5"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].productName").value("Product A"));
//    }
//
//    @Test
//    void getTopProducts_staffRole_shouldUseUserStore() throws Exception {
//        when(jwtAuthenticationService.extractAuthenticatedUser(any())).thenReturn(validUser);
//        when(jwtAuthenticationService.getUserRoles(validUser)).thenReturn(Arrays.asList("STAFF"));
//
//        TopProductDto topProduct = new TopProductDto();
//        topProduct.setProductName("Product A");
//        List<TopProductDto> expectedResult = Arrays.asList(topProduct);
//
//        LocalDate from = LocalDate.of(2024, 1, 1);
//        LocalDate to = LocalDate.of(2024, 1, 31);
//        LocalDateTime fromDateTime = from.atStartOfDay();
//        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
//
//        when(reportService.getTopProducts(fromDateTime, toDateTime, 5, 1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/top-products")
//                        .param("from", "2024-01-01")
//                        .param("to", "2024-01-31"))
//                .andExpect(status().isOk());
//    }
//
//    // Test getTopCustomers
//    @Test
//    void getTopCustomers_success() throws Exception {
//        TopCustomerDto topCustomer = new TopCustomerDto();
//        topCustomer.setCustomerName("Customer A");
//        topCustomer.setTotalAmount(new BigDecimal("1000000"));
//        List<TopCustomerDto> expectedResult = Arrays.asList(topCustomer);
//
//        LocalDate from = LocalDate.of(2024, 1, 1);
//        LocalDate to = LocalDate.of(2024, 1, 31);
//        LocalDateTime fromDateTime = from.atStartOfDay();
//        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
//
//        when(reportService.getTopCustomers(fromDateTime, toDateTime, 5, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/top-customers")
//                        .param("from", "2024-01-01")
//                        .param("to", "2024-01-31")
//                        .param("limit", "5"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].customerName").value("Customer A"));
//    }
//
//    // Test getRemainByProductAdvanced
//    @Test
//    void getRemainByProductAdvanced_success() throws Exception {
//        RemainByProductReportDto remainReport = new RemainByProductReportDto();
//        remainReport.setCategory("Category A");
//        remainReport.setProductName("Product A");
//        remainReport.setRemainQuantity(100);
//        List<RemainByProductReportDto> expectedResult = Arrays.asList(remainReport);
//
//        when(reportService.getRemainByProductAdvanced(null, null, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/remain-by-product-advanced"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].category").value("Category A"));
//    }
//
//    @Test
//    void getRemainByProductAdvanced_withFilters_success() throws Exception {
//        RemainByProductReportDto remainReport = new RemainByProductReportDto();
//        remainReport.setCategory("Category A");
//        remainReport.setProductName("Product A");
//        remainReport.setRemainQuantity(100);
//        List<RemainByProductReportDto> expectedResult = Arrays.asList(remainReport);
//
//        when(reportService.getRemainByProductAdvanced("1", 1L, "active")).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/remain-by-product-advanced")
//                        .param("zoneId", "1")
//                        .param("categoryId", "1")
//                        .param("status", "active"))
//                .andExpect(status().isOk());
//    }
//
//    // Test getInOutSummary
//    @Test
//    void getInOutSummary_success() throws Exception {
//        InOutSummaryDto inOutSummary = new InOutSummaryDto();
//        inOutSummary.setDate("2024-01-01");
//        inOutSummary.setImportTotal(new BigDecimal("1000000"));
//        inOutSummary.setSaleTotal(new BigDecimal("800000"));
//        List<InOutSummaryDto> expectedResult = Arrays.asList(inOutSummary);
//
//        LocalDate from = LocalDate.of(2024, 1, 1);
//        LocalDate to = LocalDate.of(2024, 1, 31);
//        LocalDateTime fromDateTime = from.atStartOfDay();
//        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
//
//        when(reportService.getInOutSummary(fromDateTime, toDateTime, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/inout-summary")
//                        .param("from", "2024-01-01")
//                        .param("to", "2024-01-31"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].date").value("2024-01-01"));
//    }
//
//    // Test getRemainSummary
//    @Test
//    void getRemainSummary_success() throws Exception {
//        CategoryRemainSummaryDto categorySummary = new CategoryRemainSummaryDto();
//        categorySummary.setCategory("Category A");
//        categorySummary.setTotalRemain(1000);
//        List<CategoryRemainSummaryDto> expectedResult = Arrays.asList(categorySummary);
//
//        when(reportService.getRemainSummary()).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/remain-summary"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].category").value("Category A"));
//    }
//
//    @Test
//    void getRemainSummary_withStoreId_success() throws Exception {
//        CategoryRemainSummaryDto categorySummary = new CategoryRemainSummaryDto();
//        categorySummary.setCategory("Category A");
//        categorySummary.setTotalRemain(1000);
//        List<CategoryRemainSummaryDto> expectedResult = Arrays.asList(categorySummary);
//
//        when(reportService.getRemainSummary(1L)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/remain-summary")
//                        .param("storeId", "1"))
//                .andExpect(status().isOk());
//    }
//
//    // Test getDailyRevenue
//    @Test
//    void getDailyRevenue_success() throws Exception {
//        DailyRevenueDto dailyRevenue = new DailyRevenueDto();
//        dailyRevenue.setTotalRevenue(new BigDecimal("1000000"));
//        dailyRevenue.setTotalOrders(50);
//
//        LocalDate from = LocalDate.of(2024, 1, 1);
//        LocalDate to = LocalDate.of(2024, 1, 31);
//        LocalDateTime fromDateTime = from.atStartOfDay();
//        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
//
//        when(reportService.getDailyRevenue(fromDateTime, toDateTime, null)).thenReturn(dailyRevenue);
//
//        mockMvc.perform(get("/api/reports/daily-revenue")
//                        .param("from", "2024-01-01")
//                        .param("to", "2024-01-31"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.totalRevenue").value(1000000));
//    }
//
//    // Test getSalesTotal
//    @Test
//    void getSalesTotal_success() throws Exception {
//        SalesShiftTotalDto salesTotal = new SalesShiftTotalDto();
//        salesTotal.setShift("Morning");
//        salesTotal.setTotalAmount(new BigDecimal("500000"));
//        List<SalesShiftTotalDto> expectedResult = Arrays.asList(salesTotal);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 8, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 1, 20, 0);
//
//        when(reportService.getSalesTotal(from, to, "shift", null, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/sales-total")
//                        .param("from", "2024-01-01T08:00:00")
//                        .param("to", "2024-01-01T20:00:00")
//                        .param("groupBy", "shift"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].shift").value("Morning"));
//    }
//
//    // Test getImportsTotal
//    @Test
//    void getImportsTotal_success() throws Exception {
//        GroupTotalDto importTotal = new GroupTotalDto();
//        importTotal.setGroup("2024-01-01");
//        importTotal.setTotalAmount(new BigDecimal("1000000"));
//        List<GroupTotalDto> expectedResult = Arrays.asList(importTotal);
//
//        LocalDate from = LocalDate.of(2024, 1, 1);
//        LocalDate to = LocalDate.of(2024, 1, 31);
//        LocalDateTime fromDateTime = from.atStartOfDay();
//        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);
//
//        when(reportService.getImportsTotal(fromDateTime, toDateTime, "day", null, null)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/imports-total")
//                        .param("from", "2024-01-01")
//                        .param("to", "2024-01-31")
//                        .param("groupBy", "day"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].group").value("2024-01-01"));
//    }
//
//    // Test getExpiringLotsAdvanced
//    @Test
//    void getExpiringLotsAdvanced_success() throws Exception {
//        ExpiringLotExtendedDto expiringLot = new ExpiringLotExtendedDto();
//        expiringLot.setProductName("Product A");
//        expiringLot.setDaysUntilExpiry(5);
//        List<ExpiringLotExtendedDto> expectedResult = Arrays.asList(expiringLot);
//
//        when(reportService.getExpiringLotsAdvanced(7, null, null, null, false)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/expiring-lots-advanced"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$[0].productName").value("Product A"));
//    }
//
//    @Test
//    void getExpiringLotsAdvanced_withFilters_success() throws Exception {
//        ExpiringLotExtendedDto expiringLot = new ExpiringLotExtendedDto();
//        expiringLot.setProductName("Product A");
//        expiringLot.setDaysUntilExpiry(5);
//        List<ExpiringLotExtendedDto> expectedResult = Arrays.asList(expiringLot);
//
//        when(reportService.getExpiringLotsAdvanced(10, 1L, 1L, 1L, true)).thenReturn(expectedResult);
//
//        mockMvc.perform(get("/api/reports/expiring-lots-advanced")
//                        .param("days", "10")
//                        .param("storeId", "1")
//                        .param("categoryId", "1")
//                        .param("productId", "1")
//                        .param("includeZeroRemain", "true"))
//                .andExpect(status().isOk());
//    }
//}