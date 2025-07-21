package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestDto {
    private Long id;

    @NotBlank(message = "Tên sản phẩm không được để trống")
    @Size(max = 1000, message = "Tên sản phẩm tối đa 1000 ký tự")
    private String productName;

    @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
    private String productDescription;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 0, message = "Số lượng phải lớn hơn hoặc bằng 0")
    private Integer productQuantity;

    @NotNull(message = "Danh mục không được để trống")
    private Long categoryId;

    @NotNull(message = "Cửa hàng không được để trống")
    private Long storeId;
}