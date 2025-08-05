package com.farmovo.backend.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DashboardSummaryDto {
    private long totalProducts;
    private long totalCustomers;
    private long totalSuppliers;
    private long totalImportOrders;
    private long totalExportOrders;
    private BigDecimal totalRevenue;
    private int expiringLots;
}