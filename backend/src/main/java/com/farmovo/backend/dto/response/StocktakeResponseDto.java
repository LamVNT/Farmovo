package com.farmovo.backend.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Data
public class StocktakeResponseDto {
    private Long id;
    private LocalDate stocktakeDate;
    private String detail; // JSON string
    private String stocktakeNote;
    private String status;
    private Long storeId;
}
