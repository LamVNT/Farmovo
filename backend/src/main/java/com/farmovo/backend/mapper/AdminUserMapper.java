package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.response.AdminUserResponseDto;
import com.farmovo.backend.models.User;
import org.mapstruct.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Collection;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
@Component
public interface AdminUserMapper {

    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.storeName")
    @Mapping(target = "createdBy", source = "createdBy")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "updatedAt")
    @Mapping(target = "deletedAt", source = "deletedAt")
    @Mapping(target = "deletedBy", source = "deletedBy")
    @Mapping(target = "password", source = "password") // Bao gồm password
    @Mapping(target = "roles", expression = "java(mapAuthorities(user.getAuthorities()))")
    AdminUserResponseDto toAdminResponseDto(User user);

    List<AdminUserResponseDto> toAdminResponseDtoList(List<User> users);

    default List<String> mapAuthorities(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return null;
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
    }
} 