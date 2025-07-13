package com.farmovo.backend.exceptions;

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }
    
    public InsufficientStockException(String productName, Integer requested, Integer available) {
        super(String.format("Không đủ hàng tồn kho cho sản phẩm '%s'. Yêu cầu: %d, Có sẵn: %d", 
                productName, requested, available));
    }
} 