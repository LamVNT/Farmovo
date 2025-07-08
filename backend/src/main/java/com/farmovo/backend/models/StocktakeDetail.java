package com.farmovo.backend.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

//tạo class POJO để parse từng dòng kiểm kê từ JSON (không phải entity):
//Các trường: productId, zonesId (List<Long>), remain, real, diff, note.
@Data
public class StocktakeDetail {
    private Long productId;
    @JsonProperty("zones_id")
    private List<Long> zones_id;
    private Integer remain;
    private Integer real;
    private Integer diff;
    private String note;
} 