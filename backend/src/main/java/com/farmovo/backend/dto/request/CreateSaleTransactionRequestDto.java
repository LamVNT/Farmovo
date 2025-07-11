package com.farmovo.backend.dto.request;

import com.farmovo.backend.dto.response.ProductSaleResponseDto;
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
public class CreateSaleTransactionRequestDto {
    private Long id;
    private Long customerId;
    private Long storeId;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private List<ProductSaleResponseDto> detail; // <-- thay vì String
    private String saleTransactionNote;
    private SaleTransactionStatus status;
    private LocalDateTime saleDate;
}

