package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeStatusLogResponseDTO {
    private Long id;
    private String modelName;
    private Long modelID;
    private String previousStatus;
    private String nextStatus;
    private String description;
    private LocalDateTime createdAt;
    private Long createdBy;
    
    // Thêm thông tin để frontend có thể navigate
    private String sourceName; // Tên của source entity (ví dụ: "PB000001", "PN000001")
    private String sourceType; // Loại source ("SALE_TRANSACTION", "IMPORT_TRANSACTION", "STOCKTAKE")
    private String sourceUrl; // URL để navigate đến source
}

