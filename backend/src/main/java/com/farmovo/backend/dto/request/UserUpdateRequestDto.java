package com.farmovo.backend.dto.request;

import lombok.Data;
import jakarta.validation.constraints.Size;

import java.util.List;

@Data
public class UserUpdateRequestDto {
    @Size(max = 255, message = "Full name must be at most 255 characters")
    private String fullName;

    @Size(max = 100, message = "Account must be at most 100 characters")
    private String username;

    @Size(max = 255, message = "Password must be at most 255 characters")
    private String password;

    private Boolean status;

    private Long storeId;

    private List<String> roles; // Thêm danh sách role

    private String email;
    private String phone;
}