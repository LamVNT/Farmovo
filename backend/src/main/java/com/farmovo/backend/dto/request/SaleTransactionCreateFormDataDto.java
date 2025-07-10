package com.farmovo.backend.dto.request;

import com.farmovo.backend.dto.response.ProductSaleResponseDto;
import com.farmovo.backend.dto.response.StoreResponseDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SaleTransactionCreateFormDataDto {
    private List<CustomerDto> customers;  // dropdown khách hàng
    private List<StoreResponseDto> stores; // dropdown cửa hàng
    private List<ProductSaleResponseDto> products; // sản phẩm có sẵn từ ImportTransactionDetail
}
