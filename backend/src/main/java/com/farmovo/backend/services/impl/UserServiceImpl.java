package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.UserRequestDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.models.Users;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.UserService;
import com.farmovo.backend.exceptions.InvalidStatusException;
import com.farmovo.backend.utils.InputUserValidation;
import com.farmovo.backend.repositories.StoreRepository;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {
    private static final Logger logger = LogManager.getLogger(UserServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private InputUserValidation inputUserValidation;

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
        try {
            // Kiểm tra các trường bắt buộc
            inputUserValidation.validateUserFields(user.getFullName(), user.getAccount(), user.getPassword());
            if (user.getStatus() == null) {
                user.setStatus(true); // Mặc định là active (true)
                logger.info("Default status set to true for new user");
            }
            // Kiểm tra và gán Store
            if (user.getStore() == null && user.getStore() != null && user.getStore().getId() != null) {
                Store store = storeRepository.findById(user.getStore().getId())
                        .orElseThrow(() -> new UserManagementException("Store not found with id: " + user.getStore().getId()));
                user.setStore(store);
            } else if (user.getStore() == null) {
                throw new UserManagementException("Store is required");
            }
            return userRepository.save(user);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            throw new UserManagementException(e.getMessage());
        }
    }

    @Override
    public Optional<Users> updateUser(Long id, Users user) {
        logger.info("Updating user with id: {}", id);
        if (userRepository.existsById(id)) {
            try {
                inputUserValidation.validateUserFields(user.getFullName(), user.getAccount(), user.getPassword());
                if (user.getStatus() != null) {
                    // Không cần validate status vì đã dùng converter
                }
                // Kiểm tra và gán Store
                if (user.getStore() != null && user.getStore().getId() != null) {
                    Store store = storeRepository.findById(user.getStore().getId())
                            .orElseThrow(() -> new UserManagementException("Store not found with id: " + user.getStore().getId()));
                    user.setStore(store);
                } else if (user.getStore() == null) {
                    throw new UserManagementException("Store is required");
                }
                user.setId(id);
                return Optional.of(userRepository.save(user));
            } catch (IllegalArgumentException e) {
                logger.error("Validation error: {}", e.getMessage());
                throw new UserManagementException(e.getMessage());
            }
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
    public Optional<Users> updateUserStatus(Long id, Boolean status) {
        logger.info("Updating status for user with id: {} to {}", id, status);
        return userRepository.findById(id).map(user -> {
            user.setStatus(status);
            logger.info("Status updated to {} for user id: {}", status, id);
            return userRepository.save(user);
        });
    }

    @Override
    public Optional<Users> toggleUserStatus(Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userRepository.findById(id).map(user -> {
            Boolean currentStatus = user.getStatus();
            Boolean newStatus = (currentStatus == null) ? true : !currentStatus;
            user.setStatus(newStatus);
            logger.info("Status toggled to {} for user id: {}", newStatus, id);
            return userRepository.save(user);
        });
    }
}