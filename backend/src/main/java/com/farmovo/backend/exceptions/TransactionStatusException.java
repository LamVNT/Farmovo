package com.farmovo.backend.exceptions;

public class TransactionStatusException extends RuntimeException {
    public TransactionStatusException(String message) {
        super(message);
    }
    
    public TransactionStatusException(String currentStatus, String requiredStatus, String action) {
        super(String.format("Không thể %s. Trạng thái hiện tại: %s, Yêu cầu: %s", 
                action, currentStatus, requiredStatus));
    }
} 