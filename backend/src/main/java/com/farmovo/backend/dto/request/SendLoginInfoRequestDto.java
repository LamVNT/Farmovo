package com.farmovo.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SendLoginInfoRequestDto {
    private String email;
    private String username;
    private String password;
    private String fullName;
    private String storeName;
}
