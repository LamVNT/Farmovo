package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.dto.response.UserResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.User;
import com.farmovo.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private static final Logger logger = LogManager.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @GetMapping("/userList")
    public List<UserResponseDto> getAllUsers() {
        logger.info("Fetching all users");
        return userService.getAllUsers().stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        logger.info("Fetching user with id: {}", id);
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(convertToResponseDTO(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @PostMapping("/createUser")
    public UserResponseDto createUser(@Valid @RequestBody UserRequestDto dto) {
        logger.info("Creating new user: {}", dto.getUsername());
        User user = userService.convertToEntity(dto);
        User savedUser = userService.saveUser(user);
        return convertToResponseDTO(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserRequestDto dto) {
        logger.info("Updating user with id: {}", id);
        User user = userService.convertToEntity(dto);
        return userService.updateUser(id, user)
                .map(updatedUser -> ResponseEntity.ok(convertToResponseDTO(updatedUser)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        logger.info("Deleting user with id: {}", id);
        if (userService.deleteUser(id)) {
            logger.info("User with id {} deleted successfully", id);
            return ResponseEntity.ok().build();
        }
        throw new UserManagementException("User not found with id: " + id);
    }


    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponseDto> updateUserStatus(@PathVariable Long id, @RequestBody Boolean status) {
        logger.info("Updating status for user with id: {} to {}", id, status);
        return userService.updateUserStatus(id, status)
                .map(user -> ResponseEntity.ok(convertToResponseDTO(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<UserResponseDto> toggleUserStatus(@PathVariable Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userService.toggleUserStatus(id)
                .map(user -> ResponseEntity.ok(convertToResponseDTO(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    private UserResponseDto convertToResponseDTO(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .status(user.getStatus())
                .createBy(user.getCreateBy())
                .createAt(user.getCreateAt())
                .updateAt(user.getUpdateAt())
                .deleteAt(user.getDeleteAt())
                .deleteBy(user.getDeleteBy())
                .storeName(user.getStore() != null ? user.getStore().getName() : null)
                .build();
    }

    @ExceptionHandler(UserManagementException.class)
    public ResponseEntity<String> handleUserManagementException(UserManagementException ex) {
        logger.error("Error: {}", ex.getMessage());
        return ResponseEntity.status(404).body(ex.getMessage());
    }
}