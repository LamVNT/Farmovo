package com.farmovo.backend.exceptions;

public class ForgotPasswordException extends RuntimeException {
    public ForgotPasswordException(String message) {
        super(message);
    }

    public ForgotPasswordException(String message, Throwable cause) {
        super(message, cause);
    }
} 