package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneRequestDto {
    private String zoneName;          // KHÔNG ĐƯỢC THIẾU
    private String zoneDescription;   // Đúng tên trường trong entity
}
