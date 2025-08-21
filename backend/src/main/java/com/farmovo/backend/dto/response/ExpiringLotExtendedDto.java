package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringLotExtendedDto {
	private Long id;
	private String productCode;
	private String productName;
	private String lotCode;
	private String zoneName;
	private LocalDateTime expireDate;
	private Integer daysLeft;
	private Long categoryId;
	private String categoryName;
	private Long storeId;
	private String storeName;
	private Integer remainQuantity;
} 