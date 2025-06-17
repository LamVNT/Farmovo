package com.farmovo.backend.services;

import com.farmovo.backend.models.Users;
import java.util.List;

import java.util.Optional;

public interface UserService {
    List<Users> getAllUsers();
    Optional<Users> getUserById(Long id);
    Users saveUser(Users user);
    Optional<Users> updateUser(Long id, Users user);
    boolean deleteUser(Long id);
    Optional<Users> updateUserStatus(Long id, String status);
    Optional<Users> toggleUserStatus(Long id);
}
