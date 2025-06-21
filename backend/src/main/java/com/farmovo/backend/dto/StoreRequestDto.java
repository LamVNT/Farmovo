package com.farmovo.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
public class StoreRequestDto {

    @NotBlank(message = "Store name is required")
    @Size(max = 255, message = "Store name must be at most 255 characters")
    private String name;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    @Size(max = 500, message = "Address must be at most 500 characters")
    private String address;

    @Size(max = 50, message = "Bank account must be at most 50 characters")
    private String bankAccount;

    private Long createBy;

    private Long deleteBy;
}
