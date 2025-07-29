package com.farmovo.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.farmovo.backend.dto.request.PageResponse;
import com.farmovo.backend.dto.request.UserRequestDto;
import com.farmovo.backend.dto.request.UserUpdateRequestDto;
import com.farmovo.backend.dto.response.UserResponseDto;
import com.farmovo.backend.exceptions.GlobalExceptionHandler;
import com.farmovo.backend.exceptions.UserManagementException;
import com.farmovo.backend.mapper.UserMapper;
import com.farmovo.backend.models.User;
import com.farmovo.backend.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;
    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserController userController;

    private ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    private User user;
    private UserResponseDto responseDto;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // sample objects
        user = new User();
        user.setId(1L);
        user.setUsername("john");
        user.setFullName("John");
        user.setStatus(true);
        user.setCreatedAt(LocalDateTime.now());

        responseDto = UserResponseDto.builder()
                .id(1L)
                .username("john")
                .fullName("John")
                .status(true)
                .createAt(LocalDateTime.now())
                .build();

        Mockito.lenient().when(userMapper.toResponseDto(any(User.class))).thenReturn(responseDto);
    }

    // 1. GET /admin/userList
    @Test
    @DisplayName("UC-G1 getAllUsers - success")
    void testGetAllUsers() throws Exception {
        Mockito.when(userService.getAllUsers()).thenReturn(List.of(user));
        mockMvc.perform(get("/api/admin/userList"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    // 2. GET /admin/users (paged search) success
    @Test
    @DisplayName("UC-S1 searchUsers - success")
    void testSearchUsersSuccess() throws Exception {
        Page<UserResponseDto> page = new PageImpl<>(List.of(responseDto), PageRequest.of(0, 10), 1);
        Mockito.when(userService.searchUsers(any(), any(), any(), any(), any(), any())).thenReturn(page);

        mockMvc.perform(get("/api/admin/users")
                        .param("page", "0")
                        .param("size", "10")
                        .param("username", "john"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].username").value("john"));
    }

    // search service throws -> 500
    @Test
    @DisplayName("UC-S2 searchUsers - service throws")
    void testSearchUsersFail() throws Exception {
        Mockito.when(userService.searchUsers(any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("fail"));
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred: fail"));
    }

    // 3. GET /admin/{id} success
    @Test
    @DisplayName("UC-G2 getUserById - success")
    void testGetUserByIdSuccess() throws Exception {
        Mockito.when(userService.getUserById(1L)).thenReturn(Optional.of(user));
        mockMvc.perform(get("/api/admin/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    // get by id not found -> 404
    @Test
    @DisplayName("UC-G3 getUserById - not found")
    void testGetUserByIdNotFound() throws Exception {
        Mockito.when(userService.getUserById(1L)).thenReturn(Optional.empty());
        mockMvc.perform(get("/api/admin/1"))
                .andExpect(status().isNotFound());
    }

    // 4. POST /admin/createUser success
    @Test
    @DisplayName("UC-P1 createUser - success")
    void testCreateUserSuccess() throws Exception {
        Mockito.when(userService.convertToEntity(any(UserRequestDto.class))).thenReturn(user);
        Mockito.when(userService.saveUser(any(User.class), any())).thenReturn(user);
        mockMvc.perform(post("/api/admin/createUser")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UserRequestDto())) )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    // createUser validation fail
    @Test
    @DisplayName("UC-P2 createUser - validation error")
    void testCreateUserValidationFail() throws Exception {
        Mockito.when(userService.convertToEntity(any(UserRequestDto.class))).thenThrow(new UserManagementException("Invalid"));
        mockMvc.perform(post("/api/admin/createUser")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    // 5. PUT /admin/{id} success
    @Test
    @DisplayName("UC-U1 updateUser - success")
    void testUpdateUserSuccess() throws Exception {
        Mockito.when(userService.convertToEntity(any(UserUpdateRequestDto.class))).thenReturn(user);
        Mockito.when(userService.updateUser(eq(1L), any(User.class))).thenReturn(Optional.of(user));
        mockMvc.perform(put("/api/admin/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    // update not found
    @Test
    @DisplayName("UC-U2 updateUser - not found")
    void testUpdateUserNotFound() throws Exception {
        Mockito.when(userService.convertToEntity(any(UserUpdateRequestDto.class))).thenReturn(user);
        Mockito.when(userService.updateUser(eq(1L), any(User.class))).thenReturn(Optional.empty());
        mockMvc.perform(put("/api/admin/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isNotFound());
    }

    // 6. DELETE /admin/{id} success
    @Test
    @DisplayName("UC-D1 deleteUser - success")
    void testDeleteUserSuccess() throws Exception {
        Mockito.when(userService.deleteUser(eq(1L), any())).thenReturn(true);
        mockMvc.perform(delete("/api/admin/1"))
                .andExpect(status().isOk());
    }

    // delete not found
    @Test
    @DisplayName("UC-D2 deleteUser - not found")
    void testDeleteUserNotFound() throws Exception {
        Mockito.when(userService.deleteUser(eq(1L), any())).thenReturn(false);
        mockMvc.perform(delete("/api/admin/1"))
                .andExpect(status().isNotFound());
    }

    // 7. PATCH /admin/{id}/status
    @Test
    @DisplayName("UC-SU1 updateUserStatus - success")
    void testUpdateStatusSuccess() throws Exception {
        Mockito.when(userService.updateUserStatus(eq(1L), eq(false))).thenReturn(Optional.of(user));
        mockMvc.perform(patch("/api/admin/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("false"))
                .andExpect(status().isOk());
    }

    // 8. PATCH /admin/{id}/toggle-status
    @Test
    @DisplayName("UC-T1 toggleStatus - success")
    void testToggleStatusSuccess() throws Exception {
        Mockito.when(userService.toggleUserStatus(1L)).thenReturn(Optional.of(user));
        mockMvc.perform(patch("/api/admin/1/toggle-status"))
                .andExpect(status().isOk());
    }

    // 9. GET /staff/me success
    @Test
    @DisplayName("UC-M1 getCurrentUser - success")
    void testGetCurrentUserSuccess() throws Exception {
        Mockito.when(userService.getUserByUsername(anyString())).thenReturn(Optional.of(user));
        mockMvc.perform(get("/api/staff/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    // 10. PUT /staff/me success (no password)
    @Test
    @DisplayName("UC-M2 updateCurrentUser - success")
    void testUpdateCurrentUserSuccess() throws Exception {
        Mockito.when(userService.convertToEntity(any(UserUpdateRequestDto.class))).thenReturn(user);
        Mockito.when(userService.getUserByUsername(anyString())).thenReturn(Optional.of(user));
        Mockito.when(userService.updateUser(eq(1L), any(User.class))).thenReturn(Optional.of(user));
        mockMvc.perform(put("/api/staff/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk());
    }

    // updateCurrentUser with password -> expect 404 (UserManagementException)
    @Test
    @DisplayName("UC-M3 updateCurrentUser - password provided (Fail)")
    void testUpdateCurrentUserPasswordProvided() throws Exception {
        UserUpdateRequestDto dto = new UserUpdateRequestDto();
        dto.setPassword("newpwd");
        mockMvc.perform(put("/api/staff/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());
    }
}