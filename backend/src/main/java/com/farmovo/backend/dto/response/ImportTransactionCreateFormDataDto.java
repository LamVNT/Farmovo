package com.farmovo.backend.dto.response;


import com.farmovo.backend.dto.request.CustomerDto;
import com.farmovo.backend.dto.request.ProductDto;
import com.farmovo.backend.dto.request.StoreRequestDto;
import com.farmovo.backend.dto.request.ZoneDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImportTransactionCreateFormDataDto {
    private List<CustomerDto> customers;  // dropdown nhà cung cấp
    private List<ProductDto> products;
    private List<ZoneResponseDto> zones;// dropdown sản phẩm
    private List<StoreRequestDto> stores;
}

