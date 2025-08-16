package com.farmovo.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class GroupTotalDto {
	private String bucket;
	private Long entityId;
	private String entityName;
	private BigDecimal totalAmount;
	private Long count;
} 