package com.farmovo.backend.dto.response;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TopCustomerDto {
    private String customerName;
    private BigDecimal totalAmount;
    private Long orderCount;
} 