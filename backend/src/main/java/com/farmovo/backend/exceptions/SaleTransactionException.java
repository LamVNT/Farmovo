package com.farmovo.backend.exceptions;

public class SaleTransactionException extends RuntimeException {
    public SaleTransactionException(String message) {
        super(message);
    }
    
    public SaleTransactionException(String message, Throwable cause) {
        super(message, cause);
    }
} 