package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.dto.request.UserUpdateRequestDto;
import com.farmovo.backend.dto.response.UserResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.User;
import com.farmovo.backend.services.UserService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class UserController {
    private static final Logger logger = LogManager.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @GetMapping("/admin/userList")
    public List<UserResponseDto> getAllUsers() {
        logger.info("Fetching all users");
        return userService.getAllUsers().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        logger.info("Fetching user with id: {}", id);
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(convertToResponseDTO(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @PostMapping("/admin/createUser")
    public UserResponseDto createUser(@Valid @RequestBody UserRequestDto dto, Principal principal) {
        logger.info("Creating new user: {} by user: {}", dto.getUsername(), principal.getName());
        User user = userService.convertToEntity(dto);
        User savedUser = userService.saveUser(user, principal);
        return convertToResponseDTO(savedUser);
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequestDto dto) {
        logger.info("Updating user with id: {}", id);
        User user = userService.convertToEntity(dto);
        return userService.updateUser(id, user)
                .map(updatedUser -> ResponseEntity.ok(convertToResponseDTO(updatedUser)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @DeleteMapping("/admin/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Principal principal) {
        logger.info("Deleting user with id: {} by user: {}", id, principal.getName());
        if (userService.deleteUser(id, principal)) {
            logger.info("User with id {} deleted successfully", id);
            return ResponseEntity.ok().build();
        }
        throw new UserManagementException("User not found with id: " + id);
    }

    @PatchMapping("/admin/{id}/status")
    public ResponseEntity<UserResponseDto> updateUserStatus(@PathVariable Long id, @RequestBody Boolean status) {
        logger.info("Updating status for user with id: {} to {}", id, status);
        return userService.updateUserStatus(id, status)
                .map(user -> ResponseEntity.ok(convertToResponseDTO(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @PatchMapping("/admin/{id}/toggle-status")
    public ResponseEntity<UserResponseDto> toggleUserStatus(@PathVariable Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userService.toggleUserStatus(id)
                .map(user -> ResponseEntity.ok(convertToResponseDTO(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @GetMapping("/staff/me")
    public ResponseEntity<UserResponseDto> getCurrentUser(Principal principal) {
        logger.info("Fetching current user: {}", principal.getName());
        User user = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new UserManagementException("User not found"));
        return ResponseEntity.ok(convertToResponseDTO(user));
    }

    @PutMapping("/staff/me")
    public ResponseEntity<UserResponseDto> updateCurrentUser(Principal principal, @Valid @RequestBody UserUpdateRequestDto dto) {
        logger.info("Updating current user: {}", principal.getName());
        if (dto.getPassword() != null) {
            throw new UserManagementException("Staff cannot update password");
        }
        User user = userService.convertToEntity(dto);
        Long userId = userService.getUserByUsername(principal.getName())
                .map(User::getId)
                .orElseThrow(() -> new UserManagementException("User not found"));
        return userService.updateUser(userId, user)
                .map(updatedUser -> ResponseEntity.ok(convertToResponseDTO(updatedUser)))
                .orElseThrow(() -> new UserManagementException("User not found"));
    }

    private UserResponseDto convertToResponseDTO(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .status(user.getStatus())
                .createAt(user.getCreatedAt())
                .updateAt(user.getUpdatedAt())
                .storeId(user.getStore() != null ? user.getStore().getId() : null) // Thêm dòng này
                .storeName(user.getStore() != null ? user.getStore().getStoreName() : null)
                .roles(user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList())
                .build();
    }

    @ExceptionHandler(UserManagementException.class)
    public ResponseEntity<String> handleUserManagementException(UserManagementException ex) {
        logger.error("Error: {}", ex.getMessage());
        return ResponseEntity.status(404).body(ex.getMessage());
    }
}