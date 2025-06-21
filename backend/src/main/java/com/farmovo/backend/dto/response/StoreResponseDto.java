package com.farmovo.backend.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class StoreResponseDto {

    private Long id;
    private String name;
    private String description;
    private String address;
    private String bankAccount;

    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}
