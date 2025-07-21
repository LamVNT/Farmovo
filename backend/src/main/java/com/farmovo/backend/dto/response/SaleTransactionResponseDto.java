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
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String saleTransactionNote;
    private SaleTransactionStatus status;
    private LocalDateTime saleDate;
    private String customerName;
    private String storeName;
    private Long createdBy;
    private String name; // mã phiếu bán
    private List<ProductSaleResponseDto> detail; // ✅ chính là mục tiêu của bạn
}

