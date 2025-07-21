package com.farmovo.backend.exceptions;

public class ImportTransactionNotFoundException extends RuntimeException {
    public ImportTransactionNotFoundException(String message) {
        super(message);
    }
} 