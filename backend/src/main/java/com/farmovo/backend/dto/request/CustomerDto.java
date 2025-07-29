package com.farmovo.backend.dto.request;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDto {
    private Long id;
    private String name;
    private String role;
    private String address;
    private String phone;
    private String email;
    private BigDecimal totalDebt;
    private Long createBy;
    private LocalDateTime createAt;
}

