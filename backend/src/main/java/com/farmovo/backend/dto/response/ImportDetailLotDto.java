package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportDetailLotDto {
    private Long id;
    private String productName;
    private String zoneName;
    private String storeName;
    private String name; // mã lô
    private LocalDateTime expireDate; // hạn dùng
    private LocalDateTime createdAt; // ngày tạo
    private Integer remainQuantity;
    private Boolean isCheck;
    private List<Long> zonesId;
    private BigDecimal unitSalePrice; // giá bán
}