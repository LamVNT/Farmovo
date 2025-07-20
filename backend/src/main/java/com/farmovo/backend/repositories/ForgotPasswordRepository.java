package com.farmovo.backend.repositories;

import com.farmovo.backend.models.ForgotPassword;
import com.farmovo.backend.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.Optional;

public interface ForgotPasswordRepository extends JpaRepository<ForgotPassword, Long> {

    @Query("SELECT fp FROM ForgotPassword fp WHERE fp.otp = ?1 AND fp.user.id = ?2")
    Optional<ForgotPassword> findByOtpAndUserId(Integer otp, Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ForgotPassword fp WHERE fp.id = :id")
    void deleteForgotPasswordById(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("DELETE FROM ForgotPassword fp WHERE fp.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM ForgotPassword fp WHERE fp.expirationTime < :currentTime")
    void deleteExpiredOtps(@Param("currentTime") Date currentTime);

    @Query("SELECT f FROM ForgotPassword f WHERE f.user.email = :email")
    Optional<ForgotPassword> findByEmail(@Param("email") String email);

    Optional<ForgotPassword> findByUser(User user);

    Optional<ForgotPassword> findByOtpAndUser(Integer otp, User user);



}
