package com.farmovo.backend.dto.response;

import com.farmovo.backend.models.ImportTransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSaleResponseDto {
    private Long importId; // importtransactiondetailID
    private Long proId;
    private String name; // tu bang Product
    private Integer quantity;
    private BigDecimal unitSalePrice;
    private ImportTransactionStatus status;// check status oke mới đem đi bán
}
