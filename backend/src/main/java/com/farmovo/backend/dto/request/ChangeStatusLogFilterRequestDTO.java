package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangeStatusLogFilterRequestDTO {
    private String modelName;
    private Long modelId;
    private String previousStatus;
    private String nextStatus;
    private String description;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
}

