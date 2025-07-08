package com.farmovo.backend.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class StocktakeDetailDto {
    private Long productId;
    private List<Long> zonesId;
    private Integer remain;
    private Integer real;
    private Integer diff;
    private String note;
} 