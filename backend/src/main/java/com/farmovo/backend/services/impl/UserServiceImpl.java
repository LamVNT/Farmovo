package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.dto.request.UserUpdateRequestDto;
import com.farmovo.backend.exceptions.InvalidStatusException;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.models.Authority;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.AuthorityRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.UserService;
import com.farmovo.backend.utils.InputUserValidation;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {
    private static final Logger logger = LogManager.getLogger(UserServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private AuthorityRepository authorityRepository;

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
    public Optional<User> getUserByUsername(String username) {
        logger.info("Retrieving user with username: {}", username);
        return userRepository.findByUsername(username);
    }

    @Override
    public User saveUser(User user) {
        logger.info("Saving new user with account: {}", user.getUsername());
        try {
            inputUserValidation.validateUserFieldsForCreate(user.getFullName(), user.getUsername(), user.getPassword());
            inputUserValidation.validateUserStatus(user.getStatus());
            if (user.getStatus() == null) {
                user.setStatus(true);
                logger.info("Default status set to true for new user");
            }
            if (user.getStore() == null) {
                throw new UserManagementException("Store is required");
            }
            // Xử lý authorities (roles) khi tạo mới
            if (user.getAuthorities() != null && !user.getAuthorities().isEmpty()) {
                user.setAuthorities(user.getAuthorities().stream()
                        .map(authority -> authorityRepository.findByRole(authority.getAuthority())
                                .orElseGet(() -> authorityRepository.save(new Authority(null, authority.getAuthority()))))
                        .collect(Collectors.toList()));
            }
            return userRepository.save(user);
        } catch (IllegalArgumentException | InvalidStatusException e) {
            logger.error("Validation error: {}", e.getMessage());
            throw new UserManagementException(e.getMessage());
        }
    }

    @Override
    public Optional<User> updateUser(Long id, User user) {
        logger.info("Updating user with id: {}", id);
        return userRepository.findById(id).map(existingUser -> {
            try {
                inputUserValidation.validateUserFieldsForUpdate(
                        user.getFullName(), user.getUsername(), user.getPassword()
                );
                inputUserValidation.validateUserStatus(user.getStatus());
                if (user.getFullName() != null) existingUser.setFullName(user.getFullName());
                if (user.getUsername() != null) existingUser.setUsername(user.getUsername());
                if (user.getPassword() != null) existingUser.setPassword(user.getPassword());
                if (user.getStatus() != null) existingUser.setStatus(user.getStatus());
                if (user.getStore() != null) existingUser.setStore(user.getStore());
                // Cập nhật authorities (roles)
                if (user.getAuthorities() != null) {
                    List<Authority> updatedAuthorities = user.getAuthorities().stream()
                            .map(authority -> authorityRepository.findByRole(authority.getAuthority())
                                    .orElseGet(() -> authorityRepository.save(new Authority(null, authority.getAuthority()))))
                            .collect(Collectors.toList());
                    existingUser.setAuthorities(updatedAuthorities);
                }
                return userRepository.save(existingUser);
            } catch (IllegalArgumentException | InvalidStatusException e) {
                logger.error("Validation error: {}", e.getMessage());
                throw new UserManagementException(e.getMessage());
            }
        });
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
            return userRepository.findById(id);
        }
        logger.warn("User not found with id: {}", id);
        return Optional.empty();
    }

    @Override
    public Optional<User> toggleUserStatus(Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userRepository.findById(id).map(user -> {
            Boolean currentStatus = user.getStatus();
            Boolean newStatus = currentStatus == null ? true : !currentStatus;
            user.setStatus(newStatus);
            logger.info("Status toggled to {} for user id: {}", newStatus, id);
            return userRepository.save(user);
        });
    }

    @Override
    public User convertToEntity(UserRequestDto dto) {
        logger.info("Converting UserRequestDto to User entity for username: {}, storeId: {}", dto.getUsername(), dto.getStoreId());
        User user = new User();
        user.setFullName(dto.getFullName());
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setStatus(dto.getStatus());
        user.setCreateBy(dto.getCreateBy());
        user.setDeleteBy(dto.getDeleteBy());
        if (dto.getStoreId() != null) {
            Store store = storeRepository.findById(dto.getStoreId())
                    .orElseThrow(() -> {
                        logger.error("Store not found with id: {} in table 'store'", dto.getStoreId());
                        return new UserManagementException("Store not found with id: " + dto.getStoreId());
                    });
            user.setStore(store);
        } else {
            throw new UserManagementException("StoreId is required");
        }
        // Xử lý roles khi tạo mới
        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            List<Authority> authorities = dto.getRoles().stream()
                    .map(role -> authorityRepository.findByRole(role)
                            .orElseGet(() -> authorityRepository.save(new Authority(null, role))))
                    .collect(Collectors.toList());
            user.setAuthorities(authorities);
        }
        return user;
    }

    @Override
    public User convertToEntity(UserUpdateRequestDto dto) {
        logger.info("Converting UserUpdateRequestDto to User entity for username: {}, storeId: {}", dto.getUsername(), dto.getStoreId());
        User user = new User();
        user.setFullName(dto.getFullName());
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setStatus(dto.getStatus());
        if (dto.getStoreId() != null) {
            Store store = storeRepository.findById(dto.getStoreId())
                    .orElseThrow(() -> {
                        logger.error("Store not found with id: {} in table 'store'", dto.getStoreId());
                        return new UserManagementException("Store not found with id: " + dto.getStoreId());
                    });
            user.setStore(store);
        } else {
            throw new UserManagementException("StoreId is required");
        }
        // Xử lý roles khi cập nhật
        if (dto.getRoles() != null) {
            List<Authority> authorities = dto.getRoles().stream()
                    .map(role -> authorityRepository.findByRole(role)
                            .orElseGet(() -> authorityRepository.save(new Authority(null, role))))
                    .collect(Collectors.toList());
            user.setAuthorities(authorities);
        }
        return user;
    }
}