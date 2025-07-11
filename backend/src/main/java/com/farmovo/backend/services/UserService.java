package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.dto.request.UserUpdateRequestDto;
import com.farmovo.backend.models.User;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();

    Optional<User> getUserById(Long id);

    Optional<User> getUserByUsername(String username);

    User saveUser(User user, Principal principal);

    Optional<User> updateUser(Long id, User user);

    boolean deleteUser(Long id, Principal principal);

    Optional<User> updateUserStatus(Long id, Boolean status);

    Optional<User> toggleUserStatus(Long id);

    User convertToEntity(UserRequestDto dto);

    User convertToEntity(UserUpdateRequestDto dto);
}