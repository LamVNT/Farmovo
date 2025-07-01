package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateImportTransactionRequestDto {
    private Long id;
    private Long customerId;
    private String status;
    private Long storeId;
    private Long staffId;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String importNote;
    private LocalDateTime importDate;
    private List<DetailDto> details;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailDto {
        private Long productId;
        private String productName;
        private Integer importQuantity;
        private Integer remainQuantity;// hai quantity này có cần thiết cần cả hai không???
        private LocalDateTime expireDate;
        private BigDecimal unitImportPrice;
        private BigDecimal unitSalePrice;
    }
}

