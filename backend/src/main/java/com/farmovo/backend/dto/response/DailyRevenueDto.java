package com.farmovo.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DailyRevenueDto {
	private BigDecimal totalSaleAmount;
	private BigDecimal totalImportAmount;
	private BigDecimal netRevenue;
} 