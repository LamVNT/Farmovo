package com.farmovo.backend.dto.response;

import com.farmovo.backend.models.SaleTransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleTransactionResponseDto {
    private Long id;
    private String name;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String saleTransactionNote;
    private SaleTransactionStatus status;
    private LocalDateTime saleDate;
    private String customerName;
    private String customerPhone;
    private String customerAddress;
    private String storeName;
    private String storeAddress;
    private Long createdBy;
    private LocalDateTime createdAt; // Thêm field ngày tạo
    private List<ProductSaleResponseDto> detail; // ✅ chính là mục tiêu của bạn

    // Link ngược về Stocktake nếu là PCB
    private Long stocktakeId;
    private String stocktakeCode;
}

