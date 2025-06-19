package com.farmovo.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class LoginResponse {
    private String username;
    private List<String> roles;
    private String jwtToken;
}
