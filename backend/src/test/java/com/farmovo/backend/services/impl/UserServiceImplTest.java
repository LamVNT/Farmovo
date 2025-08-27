package com.farmovo.backend.services.impl;

import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.mapper.UserMapper;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.AuthorityRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.validator.InputUserValidation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.junit.jupiter.api.DisplayName;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private StoreRepository storeRepository;
    @Mock
    private AuthorityRepository authorityRepository;
    @Mock
    private InputUserValidation inputUserValidation;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    private Store store;
    private User currentUser;
    private Principal principal;

    @BeforeEach
    void setUp() {
        store = new Store();
        store.setId(1L);
        store.setStoreName("Main Store");

        currentUser = new User();
        currentUser.setId(100L);
        currentUser.setUsername("admin");

        principal = () -> "admin";

        // Common stub for current user lookup (lenient to avoid unnecessary stubbing)
        lenient().when(userRepository.findByUsernameAndDeletedAtIsNull("admin"))
                .thenReturn(Optional.of(currentUser));
    }

    @Test
    void testSaveUser_Success() {
        // Arrange
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User saved = userService.saveUser(newUser, principal);

        // Assert
        verify(inputUserValidation).validateUserFieldsForCreate(eq("John Doe"), eq("johnd"), eq("password"));
        verify(userRepository).save(userCaptor.capture());
        User captured = userCaptor.getValue();
        assertThat(captured.getCreatedBy()).isEqualTo(100L);
        assertThat(saved).isNotNull();
        assertThat(saved.getUsername()).isEqualTo("johnd");
    }

    @Test
    void testSaveUser_NoStore_ThrowsException() {
        // Arrange
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(true);
        // No store set

        // Act & Assert
        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class)
                .hasMessage("Store is required");
    }

    @Test
    @DisplayName("saveUser - Email duplicate throws exception")
    void testSaveUser_EmailDuplicate_ThrowsException() {
        // Arrange
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);
        newUser.setEmail("test@example.com");

        when(userRepository.existsByEmailAndDeletedAtIsNull("test@example.com")).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class)
                .hasMessage("Email đã được sử dụng bởi tài khoản khác");
    }

    @Test
    @DisplayName("saveUser - Email not duplicate succeeds")
    void testSaveUser_EmailNotDuplicate_Success() {
        // Arrange
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);
        newUser.setEmail("test@example.com");

        when(userRepository.existsByEmailAndDeletedAtIsNull("test@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User saved = userService.saveUser(newUser, principal);

        // Assert
        assertThat(saved).isNotNull();
        assertThat(saved.getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void testUpdateUser_Success() {
        // Arrange
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setFullName("Old Name");
        existing.setUsername("olduser");
        existing.setStatus(true);
        existing.setStore(store);

        User update = new User();
        update.setFullName("New Name");
        update.setUsername("newuser");
        update.setStatus(false);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Optional<User> result = userService.updateUser(userId, update);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getFullName()).isEqualTo("New Name");
        assertThat(result.get().getUsername()).isEqualTo("newuser");
        assertThat(result.get().getStatus()).isFalse();
        verify(inputUserValidation).validateUserFieldsForUpdate(eq("New Name"), eq("newuser"), isNull());
    }

    @Test
    void testUpdateUser_NotFound() {
        Long userId = 99L;
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.empty());

        Optional<User> result = userService.updateUser(userId, new User());

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("updateUser - Email duplicate throws exception")
    void testUpdateUser_EmailDuplicate_ThrowsException() {
        // Arrange
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setFullName("Old Name");
        existing.setUsername("olduser");
        existing.setStatus(true);
        existing.setStore(store);

        User update = new User();
        update.setEmail("test@example.com");

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));
        when(userRepository.existsByEmailAndIdNotAndDeletedAtIsNull("test@example.com", userId)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userService.updateUser(userId, update))
                .isInstanceOf(UserManagementException.class)
                .hasMessage("Email đã được sử dụng bởi tài khoản khác");
    }

    @Test
    @DisplayName("updateUser - Email not duplicate succeeds")
    void testUpdateUser_EmailNotDuplicate_Success() {
        // Arrange
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setFullName("Old Name");
        existing.setUsername("olduser");
        existing.setStatus(true);
        existing.setStore(store);

        User update = new User();
        update.setEmail("test@example.com");

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));
        when(userRepository.existsByEmailAndIdNotAndDeletedAtIsNull("test@example.com", userId)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Optional<User> result = userService.updateUser(userId, update);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getEmail()).isEqualTo("test@example.com");
    }

    @Test
    void testUpdateUserStatus() {
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setStatus(false);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<User> result = userService.updateUserStatus(userId, true);

        assertThat(result).isPresent();
        assertThat(result.get().getStatus()).isTrue();
    }

    @Test
    void testToggleUserStatus() {
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setStatus(true);

        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Optional<User> result = userService.toggleUserStatus(userId);

        assertThat(result).isPresent();
        assertThat(result.get().getStatus()).isFalse();
    }

    @Test
    void testSearchUsers() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setUsername("test");
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> userPage = new PageImpl<>(List.of(user), pageable, 1);

        when(userRepository.findAll(ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<User>>any(), eq(pageable)))
                .thenReturn(userPage);
        when(userMapper.toResponseDto(user)).thenReturn(
                com.farmovo.backend.dto.response.UserResponseDto.builder()
                        .id(1L)
                        .username("test")
                        .build()
                        );

        // Act
        Page<com.farmovo.backend.dto.response.UserResponseDto> result = userService.searchUsers("test", null, null, null, null, pageable);

        // Assert
        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getUsername()).isEqualTo("test");
    }

    // ====== Validation / Boundary / Abnormal Cases (UTC) ======

    @Test
    @DisplayName("UTCID2 - saveUser: fullName=null (Fail)")
    void testSaveUser_FullNameNull_Fail() {
        // Arrange
        User newUser = new User();
        newUser.setFullName(null);
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);

        doThrow(new IllegalArgumentException("Full name must be non-empty"))
                .when(inputUserValidation).validateUserFieldsForCreate(isNull(), anyString(), anyString());

        // Act / Assert
        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCID3 - saveUser: fullName length > 50 (Fail)")
    void testSaveUser_FullNameTooLong_Fail() {
        String longName = "a".repeat(51);
        User newUser = new User();
        newUser.setFullName(longName);
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);

        doThrow(new IllegalArgumentException("Full name must not exceed 50 characters"))
                .when(inputUserValidation).validateUserFieldsForCreate(eq(longName), anyString(), anyString());

        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCID4 - saveUser: username=null (Fail)")
    void testSaveUser_UsernameNull_Fail() {
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername(null);
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);

        doThrow(new IllegalArgumentException("Account must be non-empty"))
                .when(inputUserValidation).validateUserFieldsForCreate(anyString(), isNull(), anyString());

        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCID5 - saveUser: username length > 50 (Fail)")
    void testSaveUser_UsernameTooLong_Fail() {
        String longUsername = "u".repeat(51);
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername(longUsername);
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);

        doThrow(new IllegalArgumentException("Account must not exceed 50 characters"))
                .when(inputUserValidation).validateUserFieldsForCreate(anyString(), eq(longUsername), anyString());

        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCID6 - saveUser: password=null (Fail)")
    void testSaveUser_PasswordNull_Fail() {
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword(null);
        newUser.setStatus(true);
        newUser.setStore(store);

        doThrow(new IllegalArgumentException("Password must be non-empty"))
                .when(inputUserValidation).validateUserFieldsForCreate(anyString(), anyString(), isNull());

        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCID7 - saveUser: password length > 64 (Fail)")
    void testSaveUser_PasswordTooLong_Fail() {
        String longPwd = "p".repeat(65);
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword(longPwd);
        newUser.setStatus(true);
        newUser.setStore(store);

        doThrow(new IllegalArgumentException("Password must not exceed 64 characters"))
                .when(inputUserValidation).validateUserFieldsForCreate(anyString(), anyString(), eq(longPwd));

        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCID8 - saveUser: status=null (Fail)")
    void testSaveUser_StatusNull_Fail() {
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(null);
        newUser.setStore(store);

        // Stub status validation failure
        doThrow(new com.farmovo.backend.exceptions.InvalidStatusException("Status must not be null"))
                .when(inputUserValidation).validateUserStatus(isNull());

        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTC-C7 - saveUser: duplicate username (Fail)")
    void testSaveUser_DuplicateUsername_Fail() {
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);

        // Simulate JPA unique constraint violation
        when(userRepository.save(any(User.class))).thenThrow(new org.springframework.dao.DataIntegrityViolationException("duplicate"));

        assertThatThrownBy(() -> userService.saveUser(newUser, principal))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("UTC-C14 - saveUser: roles list success (Pass)")
    void testSaveUser_RolesList_Success() {
        User newUser = new User();
        newUser.setFullName("John Doe");
        newUser.setUsername("johnd");
        newUser.setPassword("password");
        newUser.setStatus(true);
        newUser.setStore(store);

        com.farmovo.backend.models.Authority staffAuth = new com.farmovo.backend.models.Authority(null, "STAFF");

        newUser.setAuthorities(List.of(staffAuth));

        when(authorityRepository.findByRole("STAFF")).thenReturn(Optional.of(staffAuth));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User saved = userService.saveUser(newUser, principal);

        assertThat(saved.getAuthorities()).hasSize(1);
        assertThat(saved.getAuthorities())
                .anyMatch(a -> a.getAuthority().equals("STAFF"));
    }

    // ===== convertToEntity tests =====

    @Test
    @DisplayName("UTC-CONV1 - convertToEntity: store not found (Fail)")
    void testConvertToEntity_StoreNotFound() {
        com.farmovo.backend.dto.request.UserRequestDto dto = new com.farmovo.backend.dto.request.UserRequestDto();
        dto.setFullName("John");
        dto.setUsername("john");
        dto.setPassword("pwd");
        dto.setStatus(true);
        dto.setStoreId(999L);

        when(storeRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.convertToEntity(dto))
                .isInstanceOf(UserManagementException.class)
                .hasMessageContaining("Store not found");
    }

    @Test
    @DisplayName("UTC-CONV2 - convertToEntity: roles mapped success (Pass)")
    void testConvertToEntity_RolesMapping() {
        com.farmovo.backend.dto.request.UserRequestDto dto = new com.farmovo.backend.dto.request.UserRequestDto();
        dto.setFullName("John");
        dto.setUsername("john");
        dto.setPassword("pwd");
        dto.setStatus(true);
        dto.setStoreId(1L);
        dto.setRoles(List.of("MANAGER", "STAFF"));

        when(storeRepository.findById(1L)).thenReturn(Optional.of(store));

        dto.getRoles().forEach(role -> when(authorityRepository.findByRole(role)).thenReturn(Optional.of(new com.farmovo.backend.models.Authority(null, role))));

        User entity = userService.convertToEntity(dto);

        assertThat(entity.getStore()).isEqualTo(store);
        assertThat(entity.getAuthorities()).hasSize(2);
    }

    // ====== UpdateUser Validation / Abnormal ======

    @Test
    @DisplayName("UTCU2 - updateUser: fullName length > 50 (Fail)")
    void testUpdateUser_FullNameTooLong_Fail() {
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setStore(store);
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));

        String longName = "a".repeat(51);
        User update = new User();
        update.setFullName(longName);

        doThrow(new IllegalArgumentException("Full name must not exceed 50 characters"))
                .when(inputUserValidation).validateUserFieldsForUpdate(eq(longName), isNull(), isNull());

        assertThatThrownBy(() -> userService.updateUser(userId, update))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCU3 - updateUser: status=null (Fail)")
    void testUpdateUser_StatusNull_Fail() {
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setStore(store);
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));

        User update = new User();
        update.setStatus(null);

        doThrow(new com.farmovo.backend.exceptions.InvalidStatusException("Status must not be null"))
                .when(inputUserValidation).validateUserStatus(isNull());

        assertThatThrownBy(() -> userService.updateUser(userId, update))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCU4 - updateUser: username length > 50 (Fail)")
    void testUpdateUser_UsernameTooLong_Fail() {
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setStore(store);
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));

        String longUsername = "u".repeat(51);
        User update = new User();
        update.setUsername(longUsername);

        doThrow(new IllegalArgumentException("Account must not exceed 50 characters"))
                .when(inputUserValidation).validateUserFieldsForUpdate(isNull(), eq(longUsername), isNull());

        assertThatThrownBy(() -> userService.updateUser(userId, update))
                .isInstanceOf(UserManagementException.class);
    }

    @Test
    @DisplayName("UTCU5 - updateUser: password length > 64 (Fail)")
    void testUpdateUser_PasswordTooLong_Fail() {
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setStore(store);
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));

        String longPwd = "p".repeat(65);
        User update = new User();
        update.setPassword(longPwd);

        doThrow(new IllegalArgumentException("Password must not exceed 64 characters"))
                .when(inputUserValidation).validateUserFieldsForUpdate(isNull(), isNull(), eq(longPwd));

        assertThatThrownBy(() -> userService.updateUser(userId, update))
                .isInstanceOf(UserManagementException.class);
    }

    // ====== deleteUser use-case ======

    @Test
    @DisplayName("UTCD1 - deleteUser: success (Pass)")
    void testDeleteUser_Success() {
        Long userId = 1L;
        User existing = new User();
        existing.setId(userId);
        existing.setStatus(true);
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean result = userService.deleteUser(userId, principal);

        assertThat(result).isTrue();
        assertThat(existing.getStatus()).isFalse();
        assertThat(existing.getDeletedAt()).isNotNull();
        assertThat(existing.getDeletedBy()).isEqualTo(100L);
    }

    @Test
    @DisplayName("UTCD2 - deleteUser: user not found (Fail)")
    void testDeleteUser_NotFound() {
        Long userId = 99L;
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.empty());

        boolean result = userService.deleteUser(userId, principal);

        assertThat(result).isFalse();
    }

    // ====== updateUserStatus / toggleUserStatus ======

    @Test
    @DisplayName("UTCS2 - updateUserStatus: user not found (Fail)")
    void testUpdateUserStatus_NotFound() {
        Long userId = 99L;
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.empty());

        Optional<User> result = userService.updateUserStatus(userId, true);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("UTCT2 - toggleUserStatus: user not found (Fail)")
    void testToggleUserStatus_NotFound() {
        Long userId = 99L;
        when(userRepository.findByIdAndDeletedAtIsNull(userId)).thenReturn(Optional.empty());

        Optional<User> result = userService.toggleUserStatus(userId);

        assertThat(result).isEmpty();
    }

    // ====== searchUsers boundary ======

    @Test
    @DisplayName("UTCSCH2 - searchUsers: no result (Pass)")
    void testSearchUsers_NoResult() {
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, 10);
        Page<User> emptyPage = new org.springframework.data.domain.PageImpl<>(List.of(), pageable, 0);
        when(userRepository.findAll(ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<User>>any(), eq(pageable)))
                .thenReturn(emptyPage);

        Page<com.farmovo.backend.dto.response.UserResponseDto> result = userService.searchUsers("unknown", null, null, null, null, pageable);

        assertThat(result.getTotalElements()).isEqualTo(0);
    }
}