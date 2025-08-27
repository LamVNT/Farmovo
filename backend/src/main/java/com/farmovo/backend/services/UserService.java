package com.farmovo.backend.services;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.dto.request.UserUpdateRequestDto;
import com.farmovo.backend.dto.request.ProfileUpdateRequestDto;
import com.farmovo.backend.dto.request.ChangePasswordRequestDto;
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

    List<String> getAllUsernames();

    org.springframework.data.domain.Page<com.farmovo.backend.dto.response.UserResponseDto> searchUsers(String username, String email, Boolean status,
                                                                               java.time.LocalDateTime fromDate,
                                                                               java.time.LocalDateTime toDate,
                                                                               org.springframework.data.domain.Pageable pageable);

    User convertToEntity(UserRequestDto dto);

    User convertToEntity(UserUpdateRequestDto dto);
    
    // New methods for profile management
    Optional<User> updateProfile(Long userId, ProfileUpdateRequestDto dto);
    
    boolean changePassword(Long userId, ChangePasswordRequestDto dto);
}