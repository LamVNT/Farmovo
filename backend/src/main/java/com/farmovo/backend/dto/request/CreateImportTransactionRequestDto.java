package com.farmovo.backend.dto.request;

import com.farmovo.backend.models.ImportTransactionStatus;
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
    private String name;
    private Long supplierId;
    private ImportTransactionStatus status;
    private Long storeId;
    private Long staffId;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private String importTransactionNote;
    private LocalDateTime importDate;
    private Long createdBy;
    private List<DetailDto> details;
///list có 1 phần tử
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetailDto {
        private Long productId;
        private String productCode;
        private String name;
        private String productName;
        private Integer importQuantity;
        private Integer remainQuantity;
        private LocalDateTime expireDate;
        private BigDecimal unitImportPrice;
        private BigDecimal unitSalePrice;
        private List<String> zones_id;
    }
}

