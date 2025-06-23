package com.farmovo.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserResponseDto {
    private Long id;
    private String fullName;
    private String username;
    private Boolean status;
    private Long createBy;
    private LocalDateTime createAt;
    private LocalDateTime updateAt;
    private LocalDateTime deleteAt;
    private Long deleteBy;
    private String storeName;
    private List<String> roles; // Thêm danh sách role
}