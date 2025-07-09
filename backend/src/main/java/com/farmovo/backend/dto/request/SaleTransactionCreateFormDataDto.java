package com.farmovo.backend.dto.request;

import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleTransactionCreateFormDataDto {
    private List<CustomerDto> customers;  // dropdown nhà cung cấp
    private List<ProductSaleResponseDto> products;
}
