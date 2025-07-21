package com.farmovo.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) // 👈 Thêm dòng này

public class ProductSaleResponseDto {
    private Long id; // importtransactiondetailID
    private Long proId;
    private String productName; // tên sản phẩm
    private String productCode; // mã sản phẩm
    private Integer remainQuantity; // số lượng còn lại
    private Integer quantity; // số lượng đã chọn (cho sale transaction)
    private BigDecimal unitSalePrice;
    private String categoryName;
    private String storeName;
    private java.time.LocalDateTime createAt;
}
