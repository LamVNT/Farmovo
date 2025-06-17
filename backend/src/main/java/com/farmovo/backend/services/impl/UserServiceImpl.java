package com.farmovo.backend.services.impl;

import com.farmovo.backend.exceptions.InvalidStatusException;
import com.farmovo.backend.services.UserService;
import com.farmovo.backend.models.Users;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.farmovo.backend.repositories.UserRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    private static final Logger logger = LogManager.getLogger(UserServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public List<Users> getAllUsers() {
        logger.info("Retrieving all users");
        return userRepository.findAll();
    }

    @Override
    public Optional<Users> getUserById(Long id) {
        logger.info("Retrieving user with id: {}", id);
        return userRepository.findById(id);
    }

    @Override
    public Users saveUser(Users user) {
        logger.info("Saving new user with account: {}", user.getAccount());
        if (user.getStatus() == null) {
            user.setStatus("active");
            logger.info("Default status set to active for new user");
        }
        return userRepository.save(user);
    }

    @Override
    public Optional<Users> updateUser(Long id, Users user) {
        logger.info("Updating user with id: {}", id);
        if (userRepository.existsById(id)) {
            user.setId(id);
            return Optional.of(userRepository.save(user));
        }
        logger.warn("User with id {} not found for update", id);
        return Optional.empty();
    }

    @Override
    public boolean deleteUser(Long id) {
        logger.info("Attempting to delete user with id: {}", id);
        if (userRepository.existsById(id)) {
            userRepository.deleteById(id);
            logger.info("User with id {} deleted successfully", id);
            return true;
        }
        logger.warn("User with id {} not found for deletion", id);
        return false;
    }

    @Override
    public Optional<Users> updateUserStatus(Long id, String status) {
        logger.info("Updating status for user with id: {} to {}", id, status);
        if (!"active".equalsIgnoreCase(status) && !"deactive".equalsIgnoreCase(status)) {
            logger.error("Invalid status: {} for user id: {}", status, id);
            throw new InvalidStatusException("Invalid status value: " + status);
        }
        return userRepository.findById(id).map(user -> {
            user.setStatus(status.toLowerCase());
            logger.info("Status updated to {} for user id: {}", status, id);
            return userRepository.save(user);
        });
    }

    @Override
    public Optional<Users> toggleUserStatus(Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userRepository.findById(id).map(user -> {
            String newStatus = "active".equalsIgnoreCase(user.getStatus()) ? "deactive" : "active";
            user.setStatus(newStatus);
            logger.info("Status toggled to {} for user id: {}", newStatus, id);
            return userRepository.save(user);
        });
    }
}