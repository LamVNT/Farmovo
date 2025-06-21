package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusLogResponseDto {
    private Long id;
    private String model;
    private Long modelId;
    private String previousStatus;
    private String nextStatus;
    private String description;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}