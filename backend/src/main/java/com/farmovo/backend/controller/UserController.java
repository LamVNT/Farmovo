package com.farmovo.backend.controller;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.dto.request.UserUpdateRequestDto;
import com.farmovo.backend.dto.response.UserResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.mapper.UserMapper;
import com.farmovo.backend.models.User;
import com.farmovo.backend.services.UserService;
import jakarta.validation.Valid;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class UserController {
    private static final Logger logger = LogManager.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private UserMapper userMapper;

    @GetMapping("/admin/userList")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponseDto> getAllUsers() {
        logger.info("Fetching all users");
        return userService.getAllUsers().stream()
                .map(userMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    // New paged search endpoint
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.farmovo.backend.dto.request.PageResponse<UserResponseDto>> searchUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) Boolean status,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime fromDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime toDate) {

        Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<UserResponseDto> result = userService.searchUsers(username, email, status, fromDate, toDate, pageable);
        return ResponseEntity.ok(com.farmovo.backend.dto.request.PageResponse.fromPage(result));
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        logger.info("Fetching user with id: {}", id);
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(userMapper.toResponseDto(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @PostMapping("/admin/createUser")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponseDto createUser(@Valid @RequestBody UserRequestDto dto, Principal principal) {
        logger.info("Creating new user: {} by user: {}", dto.getUsername(), principal.getName());
        User user = userService.convertToEntity(dto);
        User savedUser = userService.saveUser(user, principal);
        return userMapper.toResponseDto(savedUser);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> updateUser(@PathVariable Long id, @Valid @RequestBody UserUpdateRequestDto dto) {
        logger.info("Updating user with id: {}", id);
        User user = userService.convertToEntity(dto);
        return userService.updateUser(id, user)
                .map(updatedUser -> ResponseEntity.ok(userMapper.toResponseDto(updatedUser)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Principal principal) {
        logger.info("Deleting user with id: {} by user: {}", id, principal.getName());
        if (userService.deleteUser(id, principal)) {
            logger.info("User with id {} deleted successfully", id);
            return ResponseEntity.ok().build();
        }
        throw new UserManagementException("User not found with id: " + id);
    }

    @PatchMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> updateUserStatus(@PathVariable Long id, @RequestBody Boolean status) {
        logger.info("Updating status for user with id: {} to {}", id, status);
        return userService.updateUserStatus(id, status)
                .map(user -> ResponseEntity.ok(userMapper.toResponseDto(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @PatchMapping("/admin/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDto> toggleUserStatus(@PathVariable Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userService.toggleUserStatus(id)
                .map(user -> ResponseEntity.ok(userMapper.toResponseDto(user)))
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @GetMapping("/users/me")
    public ResponseEntity<UserResponseDto> getCurrentUser(Principal principal) {
        logger.info("Fetching current user: {}", principal.getName());
        User user = userService.getUserByUsername(principal.getName())
                .orElseThrow(() -> new UserManagementException("User not found"));
        return ResponseEntity.ok(userMapper.toResponseDto(user));
    }

    @PutMapping("/users/me")
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
                .map(updatedUser -> ResponseEntity.ok(userMapper.toResponseDto(updatedUser)))
                .orElseThrow(() -> new UserManagementException("User not found"));
    }

    @ExceptionHandler(UserManagementException.class)
    public ResponseEntity<String> handleUserManagementException(UserManagementException ex) {
        logger.error("Error: {}", ex.getMessage());
        return ResponseEntity.status(404).body(ex.getMessage());
    }
}