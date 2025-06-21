package com.farmovo.backend.controller;

import com.farmovo.backend.dto.UserRequestDto;
import com.farmovo.backend.dto.UserResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.models.User;
import com.farmovo.backend.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private static final Logger logger = LogManager.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        logger.info("Fetching user with id: {}", id);
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        logger.info("Creating new user: {}", user.getUsername());
        return userService.saveUser(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        logger.info("Updating user with id: {}", id);
        return userService.updateUser(id, user)
                .map(ResponseEntity::ok)
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

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<User> toggleUserStatus(@PathVariable Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userService.toggleUserStatus(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

//    private Users convertToEntity(UserRequestDto dto) {
//        Users user = new Users();
//        user.setFullName(dto.getFullName());
//        user.setAccount(dto.getAccount());
//        user.setPassword(dto.getPassword());
//        user.setStatus(dto.getStatus());
//        if (dto.getStoreId() != null) {
//            Store store = storeRepository.findById(dto.getStoreId())
//                    .orElseThrow(() -> new UserManagementException("Store not found with id: " + dto.getStoreId()));
//            user.setStore(store);
//        } else {
//            throw new UserManagementException("StoreId is required");
//        }
//        return user;
//    }
//
//    private UserResponseDto convertToResponseDTO(Users user) {
//        UserResponseDto dto = new UserResponseDto();
//        dto.setId(user.getId());
//        dto.setFullName(user.getFullName());
//        dto.setAccount(user.getAccount());
//        dto.setStatus(user.getStatus());
//        dto.setStoreId(user.getStore() != null ? user.getStore().getId() : null);
//        dto.setCreatedBy(user.getCreatedBy());
//        dto.setCreatedAt(user.getCreatedAt());
//        dto.setUpdatedAt(user.getUpdatedAt());
//        dto.setDeletedAt(user.getDeletedAt());
//        dto.setDeletedBy(user.getDeletedBy());
//        return dto;
//    }

    @ExceptionHandler(UserManagementException.class)
    public ResponseEntity<String> handleUserManagementException(UserManagementException ex) {
        logger.error("Error: {}", ex.getMessage());
        return ResponseEntity.status(404).body(ex.getMessage());
    }
}