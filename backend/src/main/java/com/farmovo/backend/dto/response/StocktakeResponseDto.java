package com.farmovo.backend.dto.response;

import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data
public class StocktakeResponseDto {
    private Long id;
    private String name; // mã kiểm kê
    private Instant stocktakeDate;
    private List<StocktakeDetailDto> detail;    // dữ liệu đã gộp (grouped)
    private List<StocktakeDetailDto> rawDetail; // dữ liệu chi tiết từng dòng (gốc)
    private String stocktakeNote;
    private String status;
    private Long storeId;
    private String storeName; // tên kho
    private String createdByName; // tên người kiểm kê
    private java.time.LocalDateTime updatedAt; // ngày cân bằng (lấy từ entity Base)
    private Boolean hasBalance; // Có PCB liên kết không
    private Long balanceCount;  // Số lượng PCB liên kết (thường 0 hoặc 1)
}
