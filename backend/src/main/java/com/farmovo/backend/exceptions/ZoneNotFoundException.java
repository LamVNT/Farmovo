package com.farmovo.backend.exceptions;

public class ZoneNotFoundException extends RuntimeException {
    public ZoneNotFoundException(String message) {
        super(message);
    }
}