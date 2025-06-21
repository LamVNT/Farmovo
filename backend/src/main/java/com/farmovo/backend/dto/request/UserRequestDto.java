package com.farmovo.backend.dto.request;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
public class UserRequestDto {

    @NotBlank(message = "Full name is required")
    @Size(max = 255, message = "Full name must be at most 255 characters")
    private String fullName;

    @NotBlank(message = "Account is required")
    @Size(max = 100, message = "Account must be at most 100 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(max = 255, message = "Password must be at most 255 characters")
    private String password;

    @NotNull(message = "Status is required")
    private Boolean status;

    private Long createBy;

    private Long deleteBy;

    @NotNull(message = "Store ID is required")
    private Long storeId;
}
