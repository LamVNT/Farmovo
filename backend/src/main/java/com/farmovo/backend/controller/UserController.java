package com.farmovo.backend.controller;

import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.Users;
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
    public List<Users> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Users> getUserById(@PathVariable Long id) {
        logger.info("Fetching user with id: {}", id);
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @PostMapping
    public Users createUser(@RequestBody Users user) {
        logger.info("Creating new user: {}", user.getAccount());
        return userService.saveUser(user);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Users> updateUser(@PathVariable Long id, @RequestBody Users user) {
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
    public ResponseEntity<Users> toggleUserStatus(@PathVariable Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userService.toggleUserStatus(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new UserManagementException("User not found with id: " + id));
    }

    @ExceptionHandler(UserManagementException.class)
    public ResponseEntity<String> handleUserManagementException(UserManagementException ex) {
        logger.error("Error: {}", ex.getMessage());
        return ResponseEntity.status(404).body(ex.getMessage());
    }
}