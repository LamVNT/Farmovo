package com.farmovo.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
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
    private String name; // mã lô hàng LH000000
    private String batchCode; // Mã lô từ StockTake hoặc ImportTransactionDetail
    private String zoneReal; // Zone thực tế từ StockTake
    private java.time.LocalDateTime createAt;
    private java.time.LocalDateTime expireDate;
}
