package com.farmovo.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileUpdateRequestDto {
    @Size(max = 255, message = "Full name must be at most 255 characters")
    private String fullName;
    
    @Email(message = "Email format is invalid")
    private String email;
    
    @Size(max = 20, message = "Phone must be at most 20 characters")
    private String phone;
} 