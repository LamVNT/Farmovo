package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RemainByProductReportDto {
    private String category;
    private String zone;
    private String productName;
    private String status; // ví dụ: "Tốt", "Sắp hết hạn"
    private Integer remainQuantity;
}
