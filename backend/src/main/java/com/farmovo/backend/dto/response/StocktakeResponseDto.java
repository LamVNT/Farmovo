package com.farmovo.backend.dto.response;

import lombok.Data;

import java.time.Instant;

@Data
public class StocktakeResponseDto {
    private Long id;
    private Instant stocktakeDate;
    private String detail; // dữ liệu đã gộp (grouped)
    private String rawDetail; // dữ liệu chi tiết từng dòng (gốc)
    private String stocktakeNote;
    private String status;
    private Long storeId;
    private String storeName; // tên kho
    private String createdByName; // tên người kiểm kê
}
