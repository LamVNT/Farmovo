package com.farmovo.backend.exceptions;

public class ImportTransactionException extends RuntimeException {
    public ImportTransactionException(String message) {
        super(message);
    }
    
    public ImportTransactionException(String message, Throwable cause) {
        super(message, cause);
    }
} 