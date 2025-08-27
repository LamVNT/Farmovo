package com.farmovo.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class StocktakeDetailDto {
    private Long id;              // ID của ImportTransactionDetail
    private String batchCode;      // Mã lô
    private Long productId;
    private String productCode;    // Mã sản phẩm
    private String productName;    // Tên hàng
    private List<String> zones_id; // Khu vực hệ thống
    private Integer remain;
    private Integer real;
    private Integer diff;
    private String note;
    private String zoneReal;       // Khu vực thực tế (frontend truyền lên)
    private String expireDate;     // Hạn dùng
    private Boolean isCheck;       // Đã kiểm hay chưa
    private BigDecimal unitSalePrice; // Giá bán từ lô nguồn
} 