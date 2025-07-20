package com.farmovo.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZoneRequestDto {
    @NotBlank(message = "ZoneName cannot be empty")
    @Size(max = 100, message = "ZoneName must be at most 100 characters")
    private String zoneName;
    @Size(max = 100, message = "ZoneDescription must be at most 1000 characters")
    private String zoneDescription;
}
