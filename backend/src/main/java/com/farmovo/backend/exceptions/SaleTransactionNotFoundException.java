package com.farmovo.backend.exceptions;

public class SaleTransactionNotFoundException extends RuntimeException {
    public SaleTransactionNotFoundException(String message) {
        super(message);
    }
} 