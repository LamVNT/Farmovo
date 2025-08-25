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
        dto.setExpiringLots(reportService.getExpiringLots(7, 1L).size());
        return dto;
    }
}