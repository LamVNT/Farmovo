package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.dto.request.UserUpdateRequestDto;
import com.farmovo.backend.dto.request.ProfileUpdateRequestDto;
import com.farmovo.backend.dto.request.ChangePasswordRequestDto;
import com.farmovo.backend.dto.response.UserResponseDto;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.exceptions.InvalidStatusException;
import com.farmovo.backend.mapper.UserMapper;
import com.farmovo.backend.models.Authority;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.AuthorityRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.UserService;
import com.farmovo.backend.validator.InputUserValidation;
import com.farmovo.backend.validator.PasswordValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {
    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private AuthorityRepository authorityRepository;

    @Autowired
    private InputUserValidation inputUserValidation;

    @Autowired
    private UserMapper userMapper;

    @Override
    public List<User> getAllUsers() {
        logger.info("Retrieving all users (non-deleted)");
        return userRepository.findAllByDeletedAtIsNull();
    }

    @Override
    public List<String> getAllUsernames() {
        logger.info("Retrieving all usernames including soft deleted ones");
        return userRepository.findAll().stream()
                .map(User::getUsername)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<User> getUserById(Long id) {
        logger.info("Retrieving user with id: {}", id);
        return userRepository.findByIdAndDeletedAtIsNull(id);
    }

    @Override
    public Optional<User> getUserByUsername(String username) {
        logger.info("Retrieving user with username: {}", username);
        return userRepository.findByUsernameAndDeletedAtIsNull(username);
    }

    @Override
    public User saveUser(User user, Principal principal) {
        logger.info("Saving new user with account: {}", user.getUsername());
        try {
            inputUserValidation.validateUserFieldsForCreate(user.getFullName(), user.getUsername(), user.getPassword());
            inputUserValidation.validateUserStatus(user.getStatus());
            inputUserValidation.validateEmailForCreate(user.getEmail());
            if (user.getStatus() == null) {
                user.setStatus(true);
                logger.info("Default status set to true for new user");
            }
            if (user.getStore() == null) {
                throw new UserManagementException("Store is required");
            }
            // Set createdBy using the authenticated user's ID
            Long createdById = getCurrentUserId(principal);
            user.setCreatedBy(createdById);
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
        return userRepository.findByIdAndDeletedAtIsNull(id).map(existingUser -> {
            try {
                inputUserValidation.validateUserFieldsForUpdate(
                        user.getFullName(), user.getUsername(), user.getPassword()
                );
                inputUserValidation.validateUserStatus(user.getStatus());
                inputUserValidation.validateEmailForUpdate(user.getEmail());
                if (user.getFullName() != null) existingUser.setFullName(user.getFullName());
                if (user.getUsername() != null) existingUser.setUsername(user.getUsername());
                if (user.getPassword() != null) existingUser.setPassword(user.getPassword());
                if (user.getStatus() != null) existingUser.setStatus(user.getStatus());
                if (user.getEmail() != null) existingUser.setEmail(user.getEmail());
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
    public boolean deleteUser(Long id, Principal principal) {
        logger.info("Soft deleting user with id: {} by user: {}", id, principal.getName());
        return userRepository.findByIdAndDeletedAtIsNull(id).map(user -> {
            Long deletedById = getCurrentUserId(principal);
            user.setDeletedAt(LocalDateTime.now());
            user.setDeletedBy(deletedById);
            user.setStatus(false);
            userRepository.save(user);
            logger.info("User with id {} soft deleted by user id {}", id, deletedById);
            return true;
        }).orElseGet(() -> {
            logger.warn("User with id {} not found or already deleted", id);
            return false;
        });
    }

    @Override
    public Optional<User> updateUserStatus(Long id, Boolean status) {
        logger.info("Updating status for user with id: {} to {}", id, status);
        return userRepository.findByIdAndDeletedAtIsNull(id).map(user -> {
            user.setStatus(status);
            logger.info("Status updated to {} for user id: {}", status, id);
            return userRepository.save(user);
        });
    }

    @Override
    public Optional<User> toggleUserStatus(Long id) {
        logger.info("Toggling status for user with id: {}", id);
        return userRepository.findByIdAndDeletedAtIsNull(id).map(user -> {
            Boolean currentStatus = user.getStatus();
            Boolean newStatus = currentStatus == null || !currentStatus;
            user.setStatus(newStatus);
            logger.info("Status toggled to {} for user id: {}", newStatus, id);
            return userRepository.save(user);
        });
    }

    @Override
    public org.springframework.data.domain.Page<com.farmovo.backend.dto.response.UserResponseDto> searchUsers(String username, String email, Boolean status, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        Specification<User> spec = com.farmovo.backend.specification.UserSpecification.isNotDeleted()
                .and(com.farmovo.backend.specification.UserSpecification.hasUsername(username))
                .and(com.farmovo.backend.specification.UserSpecification.hasEmail(email))
                .and(com.farmovo.backend.specification.UserSpecification.hasStatus(status))
                .and(com.farmovo.backend.specification.UserSpecification.createdBetween(fromDate, toDate));

        Page<User> pageResult = userRepository.findAll(spec, pageable);
        return pageResult.map(userMapper::toResponseDto);
    }

    // Mapping now delegated to UserMapper; keep method for backward compatibility if other tests call it.
    private com.farmovo.backend.dto.response.UserResponseDto toResponseDto(User user) {
        return userMapper.toResponseDto(user);
    }

    @Override
    public User convertToEntity(UserRequestDto dto) {
        logger.info("Converting UserRequestDto to User entity for username: {}, storeId: {}", dto.getUsername(), dto.getStoreId());
        User user = new User();
        user.setFullName(dto.getFullName());
        user.setUsername(dto.getUsername());
        user.setPassword(dto.getPassword());
        user.setStatus(dto.getStatus());
        user.setEmail(dto.getEmail());
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
        user.setEmail(dto.getEmail());
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
        if (dto.getRoles() != null) {
            List<Authority> authorities = dto.getRoles().stream()
                    .map(role -> authorityRepository.findByRole(role)
                            .orElseGet(() -> authorityRepository.save(new Authority(null, role))))
                    .collect(Collectors.toList());
            user.setAuthorities(authorities);
        }
        return user;
    }

    private Long getCurrentUserId(Principal principal) {
        String username = principal.getName();
        return userRepository.findByUsernameAndDeletedAtIsNull(username)
                .map(User::getId)
                .orElseThrow(() -> {
                    logger.error("Current user not found: {}", username);
                    return new UserManagementException("Current user not found");
                });
    }

    @Override
    public Optional<User> updateProfile(Long userId, ProfileUpdateRequestDto dto) {
        logger.info("Updating profile for user with id: {}", userId);
        return userRepository.findByIdAndDeletedAtIsNull(userId).map(existingUser -> {
            try {
                // Validate email format if provided
                if (dto.getEmail() != null) {
                    inputUserValidation.validateEmailForUpdate(dto.getEmail());
                }

                // Update only allowed fields
                if (dto.getFullName() != null) {
                    existingUser.setFullName(dto.getFullName());
                }
                if (dto.getEmail() != null) {
                    existingUser.setEmail(dto.getEmail());
                }
                if (dto.getPhone() != null) {
                    existingUser.setPhone(dto.getPhone());
                }

                return userRepository.save(existingUser);
            } catch (IllegalArgumentException e) {
                logger.error("Validation error: {}", e.getMessage());
                throw new UserManagementException(e.getMessage());
            }
        });
    }

    @Override
    public boolean changePassword(Long userId, ChangePasswordRequestDto dto) {
        logger.info("Changing password for user with id: {}", userId);

        // Validate that new password and confirm password match
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new UserManagementException("New password and confirm password do not match");
        }

        // Validate new password strength
        PasswordValidator.PasswordValidationResult validationResult =
                PasswordValidator.validatePassword(dto.getNewPassword());

        if (!validationResult.isValid()) {
            throw new UserManagementException("Password validation failed: " + validationResult.getErrorMessage());
        }

        return userRepository.findByIdAndDeletedAtIsNull(userId).map(existingUser -> {
            // Verify current password
            if (!existingUser.getPassword().equals(dto.getCurrentPassword())) {
                throw new UserManagementException("Current password is incorrect");
            }

            // Update password
            existingUser.setPassword(dto.getNewPassword());
            userRepository.save(existingUser);

            logger.info("Password changed successfully for user id: {}", userId);
            return true;
        }).orElseThrow(() -> new UserManagementException("User not found"));
    }
}