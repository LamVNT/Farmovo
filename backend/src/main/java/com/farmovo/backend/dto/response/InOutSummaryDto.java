package com.farmovo.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InOutSummaryDto {
    private LocalDate date;
    private int importQuantity;
    private int exportQuantity;
    private int remainQuantity;
}
