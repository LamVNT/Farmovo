package com.farmovo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerResponseDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private BigDecimal totalDept;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
}
