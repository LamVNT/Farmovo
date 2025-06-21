package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.UserService;
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
    public List<User> getAllUsers() {
        logger.info("Retrieving all users");
        return userRepository.findAll();
    }

    @Override
    public Optional<User> getUserById(Long id) {
        logger.info("Retrieving user with id: {}", id);
        return userRepository.findById(id);
    }

    @Override
    public User saveUser(User user) {
        logger.info("Saving new user with account: {}", user.getUsername());
        try {
            inputUserValidation.validateUserFields(user.getFullName(), user.getUsername(), user.getPassword());
            if (user.getStatus() == null) {
                user.setStatus(true);
                logger.info("Default status set to true for new user");
            }
            if (user.getStore() == null) {
                throw new UserManagementException("Store is required");
            }
            return userRepository.save(user);
        } catch (IllegalArgumentException e) {
            logger.error("Validation error: {}", e.getMessage());
            throw new UserManagementException(e.getMessage());
        }
    }

    @Override
    public Optional<User> updateUser(Long id, User user) {
        logger.info("Updating user with id: {}", id);
        if (userRepository.existsById(id)) {
            try {
                inputUserValidation.validateUserFields(user.getFullName(), user.getUsername(), user.getPassword());
                if (user.getStore() == null) {
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
    public Optional<User> updateUserStatus(Long id, Boolean status) {
        logger.info("Updating status for user with id: {} to {}", id, status);

        int updated = userRepository.updateStatusById(id, status);
        if (updated > 0) {
            logger.info("Status updated to {} for user id: {}", status, id);
            return userRepository.findById(id); // chỉ lấy lại user để trả về
        } else {
            logger.warn("User not found with id: {}", id);
            return Optional.empty();
        }
    }


    @Override
    public Optional<User> toggleUserStatus(Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userRepository.findById(id).map(user -> {
            Boolean currentStatus = user.getStatus();
            Boolean newStatus = currentStatus == null || !currentStatus;
            user.setStatus(newStatus);
            logger.info("Status toggled to {} for user id: {}", newStatus, id);
            return user;
        });
    }

    @Override
    public User convertToEntity(UserRequestDto dto) {
        logger.info("Converting UserRequestDto to User entity for username: {}", dto.getUsername());
        User user = new User();
        user.setFullName(dto.getFullName());
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setStatus(dto.getStatus());
        user.setCreateBy(dto.getCreateBy());
        user.setDeleteBy(dto.getDeleteBy());
        if (dto.getStoreId() != null) {
            Store store = storeRepository.findById(dto.getStoreId())
                    .orElseThrow(() -> new UserManagementException("Store not found with id: " + dto.getStoreId()));
            user.setStore(store);
        } else {
            throw new UserManagementException("StoreId is required");
        }
        return user;
    }
}