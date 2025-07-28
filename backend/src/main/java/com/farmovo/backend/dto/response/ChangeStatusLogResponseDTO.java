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
}

