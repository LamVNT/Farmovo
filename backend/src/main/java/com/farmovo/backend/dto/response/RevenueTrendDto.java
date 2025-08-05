package com.farmovo.backend.dto.response;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class RevenueTrendDto {
    private String label; // ngày/tháng/năm
    private BigDecimal revenue;
} 