package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.response.DashboardSummaryDto;
import com.farmovo.backend.repositories.*;
import com.farmovo.backend.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private ImportTransactionRepository importTransactionRepository;
    @Autowired
    private SaleTransactionRepository saleTransactionRepository;
    @Autowired
    private ReportService reportService;

    @Override
    public DashboardSummaryDto getSummary() {
        DashboardSummaryDto dto = new DashboardSummaryDto();
        dto.setTotalProducts(productRepository.count());
        dto.setTotalCustomers(customerRepository.count());
        dto.setTotalSuppliers(customerRepository.countSuppliers());
        dto.setTotalImportOrders(importTransactionRepository.count());
        dto.setTotalExportOrders(saleTransactionRepository.count());
        dto.setTotalRevenue(saleTransactionRepository.sumTotalAmount());
        dto.setExpiringLots(reportService.getExpiringLots(7, null).size()); // null = all stores
        return dto;
    }

    @Override
    public DashboardSummaryDto getSummaryByStore(Long storeId) {
        DashboardSummaryDto dto = new DashboardSummaryDto();

        // Lấy dữ liệu theo kho cụ thể
        dto.setTotalProducts(productRepository.countByStoreId(storeId));
        dto.setTotalCustomers(customerRepository.count()); // Khách hàng chung cho tất cả kho
        dto.setTotalSuppliers(customerRepository.countSuppliers()); // Nhà cung cấp chung
        dto.setTotalImportOrders(importTransactionRepository.countByStoreId(storeId));
        dto.setTotalExportOrders(saleTransactionRepository.countByStoreId(storeId));

        // Tính tổng doanh thu theo kho
        BigDecimal storeRevenue = saleTransactionRepository.sumTotalAmountByStoreId(storeId);
        dto.setTotalRevenue(storeRevenue != null ? storeRevenue : BigDecimal.ZERO);

        dto.setExpiringLots(reportService.getExpiringLots(7, storeId).size());
        return dto;
    }
}