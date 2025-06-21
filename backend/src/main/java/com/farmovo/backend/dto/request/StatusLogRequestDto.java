package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusLogRequestDto {
    private String model;
    private Long modelId;
    private String previousStatus;
    private String nextStatus;
    private String description;
}