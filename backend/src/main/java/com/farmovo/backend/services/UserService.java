package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.models.User;
import java.util.List;
import java.util.Optional;

public interface UserService {
    List<User> getAllUsers();
    Optional<User> getUserById(Long id);
    User saveUser(User user);
    Optional<User> updateUser(Long id, User user);
    boolean deleteUser(Long id);
    Optional<User> updateUserStatus(Long id, Boolean status);
    Optional<User> toggleUserStatus(Long id);
    User convertToEntity(UserRequestDto dto);
}