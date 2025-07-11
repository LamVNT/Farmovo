package com.farmovo.backend.exceptions;

import com.farmovo.backend.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LogManager.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthError(
            AuthenticationException ex,
            HttpServletRequest request // 👈 PHẢI có dòng này!
    ) {
        ErrorResponse error = new ErrorResponse(
                LocalDateTime.now(),
                "Tên đăng nhập hoặc mật khẩu không đúng!",
                "Unauthorized",
                request.getRequestURI() // 👈 lấy được path
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<?> handleUserNotFound(UserNotFoundException ex, HttpServletRequest request) {
        ErrorResponse userNotFound = new ErrorResponse(LocalDateTime.now(), ex.getMessage(), "User not found"
                , request.getRequestURI());
        return new ResponseEntity<>(userNotFound, HttpStatus.NOT_FOUND);
    }


    @ExceptionHandler(UserManagementException.class)
    public ResponseEntity<String> handleUserManagementException(UserManagementException ex) {
        logger.error("User Management Error: {}", ex.getMessage());
        return ResponseEntity.status(404).body(ex.getMessage());
    }

    @ExceptionHandler(InvalidStatusException.class)
    public ResponseEntity<String> handleInvalidStatusException(InvalidStatusException ex) {
        logger.error("Invalid Status Error: {}", ex.getMessage());
        return ResponseEntity.status(400).body(ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex) {
        logger.error("Validation Error: {}", ex.getMessage());
        return ResponseEntity.status(400).body(ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGenericException(Exception ex) {
        logger.error("Unexpected Error: {}", ex.getMessage());
        return ResponseEntity.status(500).body("An unexpected error occurred: " + ex.getMessage());
    }


}