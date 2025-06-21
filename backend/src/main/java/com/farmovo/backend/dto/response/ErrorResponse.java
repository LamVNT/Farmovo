package com.farmovo.backend.dto.response;


import java.time.LocalDateTime;


public class ErrorResponse {
    private LocalDateTime timestamp;
    private String message;
    private String details;
    private String path;


    public ErrorResponse(LocalDateTime timestamp, String details, String message, String path) {
        this.timestamp = timestamp;
        this.details = details;
        this.message = message;
        this.path = path;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}
