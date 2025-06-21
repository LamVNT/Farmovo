package com.farmovo.backend.utils;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResponseUtils {
    public static <T> ResponseEntity<T> success(T data) {
        return new ResponseEntity<>(data, HttpStatus.OK);
    }
}