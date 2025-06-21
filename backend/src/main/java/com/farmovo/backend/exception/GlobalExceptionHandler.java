package com.farmovo.backend.exception;

import com.farmovo.backend.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

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
    public ResponseEntity<?> handleUserNotFound(UserNotFoundException ex,HttpServletRequest request) {
        ErrorResponse userNotFound = new ErrorResponse(LocalDateTime.now(),ex.getMessage(),"User not found"
                ,request.getRequestURI());
        return new ResponseEntity<>(userNotFound,HttpStatus.NOT_FOUND);
    }


}
