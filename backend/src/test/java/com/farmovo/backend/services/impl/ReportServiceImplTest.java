//package com.farmovo.backend.services.impl;
//
//import com.farmovo.backend.dto.response.*;
//import com.farmovo.backend.models.*;
//import com.farmovo.backend.repositories.*;
//import com.farmovo.backend.services.ReportService;
//import com.fasterxml.jackson.core.type.TypeReference;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//import org.springframework.data.domain.PageRequest;
//
//import java.math.BigDecimal;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.time.LocalTime;
//import java.util.Arrays;
//import java.util.List;
//import java.util.Optional;
//
//import static org.assertj.core.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class ReportServiceImplTest {
//
//    @Mock
//    private ImportTransactionDetailRepository importTransactionDetailRepository;
//
//    @Mock
//    private StocktakeRepository stocktakeRepository;
//
//    @Mock
//    private SaleTransactionRepository saleTransactionRepository;
//
//    @Mock
//    private ProductRepository productRepository;
//
//    @Mock
//    private ZoneRepository zoneRepository;
//
//    @Mock
//    private CategoryRepository categoryRepository;
//
//    @Mock
//    private ImportTransactionRepository importTransactionRepository;
//
//    @Mock
//    private UserRepository userRepository;
//
//    @Mock
//    private JwtAuthenticationService jwtAuthenticationService;
//
//    @Mock
//    private ObjectMapper objectMapper;
//
//    @InjectMocks
//    private ReportServiceImpl reportService;
//
//    private Store validStore;
//    private Product validProduct;
//    private Category validCategory;
//    private Zone validZone;
//    private ImportTransactionDetail validImportDetail;
//    private Stocktake validStocktake;
//    private SaleTransaction validSaleTransaction;
//    private User validUser;
//
//    @BeforeEach
//    void setup() {
//        // Setup test data
//        validStore = new Store();
//        validStore.setId(1L);
//        validStore.setStoreName("Store A");
//
//        validCategory = new Category();
//        validCategory.setId(1L);
//        validCategory.setCategoryName("Category A");
//
//        validZone = new Zone();
//        validZone.setId(1L);
//        validZone.setZoneName("Zone A");
//
//        validProduct = new Product();
//        validProduct.setId(1L);
//        validProduct.setProductName("Product A");
//        validProduct.setProductCode("PA001");
//        validProduct.setCategory(validCategory);
//        validProduct.setStore(validStore);
//
//        validImportDetail = new ImportTransactionDetail();
//        validImportDetail.setId(1L);
//        validImportDetail.setProduct(validProduct);
//        validImportDetail.setRemainQuantity(100);
//        validImportDetail.setUnitImportPrice(new BigDecimal("1000"));
//        validImportDetail.setUnitSalePrice(new BigDecimal("1500"));
//        validImportDetail.setZones_id("1,2");
//        validImportDetail.setExpireDate(LocalDateTime.now().plusDays(30));
//
//        validStocktake = new Stocktake();
//        validStocktake.setId(1L);
//        validStocktake.setName("KK000001");
//        validStocktake.setStore(validStore);
//        validStocktake.setDetail("[{\"id\":1,\"diff\":-5}]");
//
//        validSaleTransaction = new SaleTransaction();
//        validSaleTransaction.setId(1L);
//        validSaleTransaction.setTotalAmount(new BigDecimal("1000000"));
//        validSaleTransaction.setSaleDate(LocalDateTime.now());
//
//        validUser = new User();
//        validUser.setId(1L);
//        validUser.setStore(validStore);
//    }
//
//    // Test getRemainByProduct
//    @Test
//    void getRemainByProduct_withStoreId_success() {
//        Object[] resultRow = {1L, 100};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        when(importTransactionDetailRepository.getRemainByProductCompletedByStore(ImportTransactionStatus.COMPLETE, 1L))
//                .thenReturn(queryResult);
//
//        List<ProductRemainDto> result = reportService.getRemainByProduct(1L);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductId()).isEqualTo(1L);
//        assertThat(result.get(0).getRemainQuantity()).isEqualTo(100);
//    }
//
//    @Test
//    void getRemainByProduct_withoutStoreId_success() {
//        Object[] resultRow = {1L, 100};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        when(importTransactionDetailRepository.getRemainByProductCompleted(ImportTransactionStatus.COMPLETE))
//                .thenReturn(queryResult);
//
//        List<ProductRemainDto> result = reportService.getRemainByProduct(null);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductId()).isEqualTo(1L);
//        assertThat(result.get(0).getRemainQuantity()).isEqualTo(100);
//    }
//
//    // Test getStocktakeDiff
//    @Test
//    void getStocktakeDiff_success() {
//        when(stocktakeRepository.findMaxId()).thenReturn(1L);
//        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
//
//        StocktakeDetailDto detailDto = new StocktakeDetailDto();
//        detailDto.setId(1L);
//        detailDto.setDiff(-5);
//        List<StocktakeDetailDto> details = Arrays.asList(detailDto);
//
//        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(details);
//        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));
//
//        List<StocktakeDetailDto> result = reportService.getStocktakeDiff();
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getDiff()).isEqualTo(-5);
//    }
//
//    @Test
//    void getStocktakeDiff_noStocktake_shouldReturnEmptyList() {
//        when(stocktakeRepository.findMaxId()).thenReturn(null);
//
//        List<StocktakeDetailDto> result = reportService.getStocktakeDiff();
//
//        assertThat(result).isEmpty();
//    }
//
//    @Test
//    void getStocktakeDiffById_success() {
//        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
//
//        StocktakeDetailDto detailDto = new StocktakeDetailDto();
//        detailDto.setId(1L);
//        detailDto.setDiff(-5);
//        List<StocktakeDetailDto> details = Arrays.asList(detailDto);
//
//        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(details);
//        when(productRepository.findById(1L)).thenReturn(Optional.of(validProduct));
//
//        List<StocktakeDetailDto> result = reportService.getStocktakeDiffById(1L);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getDiff()).isEqualTo(-5);
//    }
//
//    @Test
//    void getStocktakeDiffById_stocktakeNotFound_shouldReturnEmptyList() {
//        when(stocktakeRepository.findById(999L)).thenReturn(Optional.empty());
//
//        List<StocktakeDetailDto> result = reportService.getStocktakeDiffById(999L);
//
//        assertThat(result).isEmpty();
//    }
//
//    // Test getExpiringLots
//    @Test
//    void getExpiringLots_success() {
//        when(importTransactionDetailRepository.findExpiringLots(7, 1L)).thenReturn(Arrays.asList(validImportDetail));
//
//        List<ExpiringLotDto> result = reportService.getExpiringLots(7, 1L);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
//    }
//
//    @Test
//    void getExpiringLots_withoutStoreId_success() {
//        when(importTransactionDetailRepository.findExpiringLots(7, null)).thenReturn(Arrays.asList(validImportDetail));
//
//        List<ExpiringLotDto> result = reportService.getExpiringLots(7, null);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
//    }
//
//    // Test getRevenueTrend
//    @Test
//    void getRevenueTrend_success() {
//        Object[] resultRow = {"2024-01-01", new BigDecimal("1000000")};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//
//        when(saleTransactionRepository.getRevenueTrend("day", from, to, null)).thenReturn(queryResult);
//
//        List<RevenueTrendDto> result = reportService.getRevenueTrend("day", from, to);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getLabel()).isEqualTo("2024-01-01");
//        assertThat(result.get(0).getRevenue()).isEqualTo(new BigDecimal("1000000"));
//    }
//
//    @Test
//    void getRevenueTrend_withStoreId_success() {
//        Object[] resultRow = {"2024-01-01", new BigDecimal("1000000")};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//
//        when(saleTransactionRepository.getRevenueTrend("day", from, to, 1L)).thenReturn(queryResult);
//
//        List<RevenueTrendDto> result = reportService.getRevenueTrend("day", from, to, 1L);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getLabel()).isEqualTo("2024-01-01");
//        assertThat(result.get(0).getRevenue()).isEqualTo(new BigDecimal("1000000"));
//    }
//
//    // Test getStockByCategory
//    @Test
//    void getStockByCategory_success() {
//        Object[] resultRow = {"Category A", 1000};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        when(importTransactionDetailRepository.getStockByCategoryCompleted(ImportTransactionStatus.COMPLETE))
//                .thenReturn(queryResult);
//
//        List<StockByCategoryDto> result = reportService.getStockByCategory();
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getCategory()).isEqualTo("Category A");
//        assertThat(result.get(0).getStock()).isEqualTo(1000);
//    }
//
//    @Test
//    void getStockByCategory_withStoreId_success() {
//        Object[] resultRow = {"Category A", 1000};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        when(importTransactionDetailRepository.getStockByCategoryCompletedByStore(ImportTransactionStatus.COMPLETE, 1L))
//                .thenReturn(queryResult);
//
//        List<StockByCategoryDto> result = reportService.getStockByCategory(1L);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getCategory()).isEqualTo("Category A");
//        assertThat(result.get(0).getStock()).isEqualTo(1000);
//    }
//
//    // Test getTopProducts
//    @Test
//    void getTopProducts_success() {
//        Object[] resultRow = {"Product A", "Category A", 100L};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//        PageRequest pageable = PageRequest.of(0, 5);
//
//        when(importTransactionDetailRepository.getTopProducts(from, to, pageable)).thenReturn(queryResult);
//
//        List<TopProductDto> result = reportService.getTopProducts(from, to, 5);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
//        assertThat(result.get(0).getCategory()).isEqualTo("Category A");
//        assertThat(result.get(0).getQuantity()).isEqualTo(100L);
//    }
//
//    @Test
//    void getTopProducts_withStoreId_success() {
//        Object[] resultRow = {"Product A", "Category A", 100L};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//        PageRequest pageable = PageRequest.of(0, 5);
//
//        when(importTransactionDetailRepository.getTopProductsByStore(from, to, 1L, pageable)).thenReturn(queryResult);
//
//        List<TopProductDto> result = reportService.getTopProducts(from, to, 5, 1L);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
//        assertThat(result.get(0).getCategory()).isEqualTo("Category A");
//        assertThat(result.get(0).getQuantity()).isEqualTo(100L);
//    }
//
//    // Test getTopCustomers
//    @Test
//    void getTopCustomers_success() {
//        Object[] resultRow = {"Customer A", new BigDecimal("1000000")};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//        PageRequest pageable = PageRequest.of(0, 5);
//
//        when(saleTransactionRepository.getTopCustomers(from, to, pageable)).thenReturn(queryResult);
//
//        List<TopCustomerDto> result = reportService.getTopCustomers(from, to, 5);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getCustomerName()).isEqualTo("Customer A");
//        assertThat(result.get(0).getTotalAmount()).isEqualTo(new BigDecimal("1000000"));
//    }
//
//    @Test
//    void getTopCustomers_withStoreId_success() {
//        Object[] resultRow = {"Customer A", new BigDecimal("1000000")};
//        List<Object[]> queryResult = Arrays.asList(resultRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//        PageRequest pageable = PageRequest.of(0, 5);
//
//        when(saleTransactionRepository.getTopCustomersByStore(from, to, 1L, pageable)).thenReturn(queryResult);
//
//        List<TopCustomerDto> result = reportService.getTopCustomers(from, to, 5, 1L);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getCustomerName()).isEqualTo("Customer A");
//        assertThat(result.get(0).getTotalAmount()).isEqualTo(new BigDecimal("1000000"));
//    }
//
//    // Test getRemainByProductAdvanced
//    @Test
//    void getRemainByProductAdvanced_success() {
//        when(importTransactionDetailRepository.findAll()).thenReturn(Arrays.asList(validImportDetail));
//
//        List<RemainByProductReportDto> result = reportService.getRemainByProductAdvanced(null, null, null);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
//        assertThat(result.get(0).getCategory()).isEqualTo("Category A");
//    }
//
//    @Test
//    void getRemainByProductAdvanced_withZoneFilter_success() {
//        when(importTransactionDetailRepository.findAll()).thenReturn(Arrays.asList(validImportDetail));
//
//        List<RemainByProductReportDto> result = reportService.getRemainByProductAdvanced("1", null, null);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getZone()).isEqualTo("Zone A");
//    }
//
//    @Test
//    void getRemainByProductAdvanced_withCategoryFilter_success() {
//        when(importTransactionDetailRepository.findAll()).thenReturn(Arrays.asList(validImportDetail));
//
//        List<RemainByProductReportDto> result = reportService.getRemainByProductAdvanced(null, 1L, null);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getCategory()).isEqualTo("Category A");
//    }
//
//    // Test getInOutSummary
//    @Test
//    void getInOutSummary_success() {
//        Object[] importRow = {"2024-01-01", new BigDecimal("1000000")};
//        Object[] saleRow = {"2024-01-01", new BigDecimal("800000")};
//        List<Object[]> importResult = Arrays.asList(importRow);
//        List<Object[]> saleResult = Arrays.asList(saleRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//
//        when(importTransactionRepository.getImportsTotalByDate(from, to, null)).thenReturn(importResult);
//        when(saleTransactionRepository.getSalesTotalByDate(from, to, null)).thenReturn(saleResult);
//
//        List<InOutSummaryDto> result = reportService.getInOutSummary(from, to, null);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getDate()).isEqualTo("2024-01-01");
//        assertThat(result.get(0).getImportTotal()).isEqualTo(new BigDecimal("1000000"));
//        assertThat(result.get(0).getSaleTotal()).isEqualTo(new BigDecimal("800000"));
//    }
//
//    // Test getRemainSummary
//    @Test
//    void getRemainSummary_success() {
//        when(importTransactionDetailRepository.findAll()).thenReturn(Arrays.asList(validImportDetail));
//
//        List<CategoryRemainSummaryDto> result = reportService.getRemainSummary();
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getCategory()).isEqualTo("Category A");
//        assertThat(result.get(0).getTotalRemain()).isEqualTo(100);
//    }
//
//    @Test
//    void getRemainSummary_withStoreId_success() {
//        when(importTransactionDetailRepository.findAll()).thenReturn(Arrays.asList(validImportDetail));
//
//        List<CategoryRemainSummaryDto> result = reportService.getRemainSummary(1L);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getCategory()).isEqualTo("Category A");
//        assertThat(result.get(0).getTotalRemain()).isEqualTo(100);
//    }
//
//    // Test getDailyRevenue
//    @Test
//    void getDailyRevenue_success() {
//        Object[] revenueRow = {new BigDecimal("1000000"), 50L};
//        List<Object[]> queryResult = Arrays.asList(revenueRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//
//        when(saleTransactionRepository.getDailyRevenue(from, to, null)).thenReturn(queryResult);
//
//        DailyRevenueDto result = reportService.getDailyRevenue(from, to, null);
//
//        assertThat(result).isNotNull();
//        assertThat(result.getTotalRevenue()).isEqualTo(new BigDecimal("1000000"));
//        assertThat(result.getTotalOrders()).isEqualTo(50L);
//    }
//
//    // Test getSalesTotal
//    @Test
//    void getSalesTotal_success() {
//        Object[] salesRow = {"Morning", new BigDecimal("500000")};
//        List<Object[]> queryResult = Arrays.asList(salesRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 8, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 1, 20, 0);
//
//        when(saleTransactionRepository.getSalesTotalByShift(from, to, null, null)).thenReturn(queryResult);
//
//        List<SalesShiftTotalDto> result = reportService.getSalesTotal(from, to, "shift", null, null);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getShift()).isEqualTo("Morning");
//        assertThat(result.get(0).getTotalAmount()).isEqualTo(new BigDecimal("500000"));
//    }
//
//    // Test getImportsTotal
//    @Test
//    void getImportsTotal_success() {
//        Object[] importRow = {"2024-01-01", new BigDecimal("1000000")};
//        List<Object[]> queryResult = Arrays.asList(importRow);
//
//        LocalDateTime from = LocalDateTime.of(2024, 1, 1, 0, 0);
//        LocalDateTime to = LocalDateTime.of(2024, 1, 31, 23, 59);
//
//        when(importTransactionRepository.getImportsTotalByDate(from, to, null, null)).thenReturn(queryResult);
//
//        List<GroupTotalDto> result = reportService.getImportsTotal(from, to, "day", null, null);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getGroup()).isEqualTo("2024-01-01");
//        assertThat(result.get(0).getTotalAmount()).isEqualTo(new BigDecimal("1000000"));
//    }
//
//    // Test getExpiringLotsAdvanced
//    @Test
//    void getExpiringLotsAdvanced_success() {
//        when(importTransactionDetailRepository.findExpiringLotsAdvanced(7, null, null, null, false))
//                .thenReturn(Arrays.asList(validImportDetail));
//
//        List<ExpiringLotExtendedDto> result = reportService.getExpiringLotsAdvanced(7, null, null, null, false);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
//    }
//
//    @Test
//    void getExpiringLotsAdvanced_withFilters_success() {
//        when(importTransactionDetailRepository.findExpiringLotsAdvanced(10, 1L, 1L, 1L, true))
//                .thenReturn(Arrays.asList(validImportDetail));
//
//        List<ExpiringLotExtendedDto> result = reportService.getExpiringLotsAdvanced(10, 1L, 1L, 1L, true);
//
//        assertThat(result).hasSize(1);
//        assertThat(result.get(0).getProductName()).isEqualTo("Product A");
//    }
//
//    // Test error handling
//    @Test
//    void getStocktakeDiff_jsonParseError_shouldReturnEmptyList() {
//        when(stocktakeRepository.findMaxId()).thenReturn(1L);
//        when(stocktakeRepository.findById(1L)).thenReturn(Optional.of(validStocktake));
//        when(objectMapper.readValue(anyString(), any(TypeReference.class)))
//                .thenThrow(new RuntimeException("JSON parse error"));
//
//        List<StocktakeDetailDto> result = reportService.getStocktakeDiff();
//
//        assertThat(result).isEmpty();
//    }
//
//    @Test
//    void getRemainSummary_productWithoutCategory_shouldSkipProduct() {
//        validProduct.setCategory(null);
//        when(importTransactionDetailRepository.findAll()).thenReturn(Arrays.asList(validImportDetail));
//
//        List<CategoryRemainSummaryDto> result = reportService.getRemainSummary();
//
//        assertThat(result).isEmpty();
//    }
//
//    @Test
//    void getRemainSummary_productWithoutStore_shouldSkipProduct() {
//        validProduct.setStore(null);
//        when(importTransactionDetailRepository.findAll()).thenReturn(Arrays.asList(validImportDetail));
//
//        List<CategoryRemainSummaryDto> result = reportService.getRemainSummary(1L);
//
//        assertThat(result).isEmpty();
//    }
//}