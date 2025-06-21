package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerRequestDto {
    private String name;
    private String email;
    private String phone;
    private String role;
    private BigDecimal totalDept;
}
