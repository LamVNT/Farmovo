package com.farmovo.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SalesShiftTotalDto {
	private String label;
	private Long cashierId;
	private String cashierName;
	private BigDecimal totalAmount;
	private Long orderCount;
} 