package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoreRequestDto {
    @NotBlank(message = "Tên cửa hàng không được để trống")
    @Size(max = 255, message = "Tên cửa hàng tối đa 255 ký tự")
    private String storeName;

    @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
    private String storeDescription;

    @NotBlank(message = "Địa chỉ không được để trống")
    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String storeAddress;
}
