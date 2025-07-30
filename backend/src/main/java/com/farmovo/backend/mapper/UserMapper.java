package com.farmovo.backend.mapper;

import com.farmovo.backend.dto.response.UserResponseDto;
import com.farmovo.backend.models.User;
import org.mapstruct.*;
import org.mapstruct.factory.Mappers;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Collection;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true))
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(target = "storeId", source = "store.id")
    @Mapping(target = "storeName", source = "store.storeName")
    @Mapping(target = "roles", expression = "java(mapAuthorities(user.getAuthorities()))")
    UserResponseDto toResponseDto(User user);

    List<UserResponseDto> toResponseDtoList(List<User> users);

    default List<String> mapAuthorities(Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) return null;
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
    }
} 