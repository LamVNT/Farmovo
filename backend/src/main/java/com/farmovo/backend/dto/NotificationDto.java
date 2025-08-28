package com.farmovo.backend.dto;

import com.farmovo.backend.models.Notification;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class NotificationDto {
    private Long id;
    private String title;
    private String message;
    private Notification.NotificationType type;
    private Notification.NotificationCategory category;

    private Boolean isRead;
    private String actionUrl;
    private Long entityId;
    private String entityType;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Long storeId;
    private String storeName;
    private Long createdBy; // ID của user tạo notification
    private String createdByUserName; // Tên người tạo notification
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    
    // Constructor để chuyển đổi từ Entity
    public NotificationDto(Notification notification) {
        this.id = notification.getId();
        this.title = notification.getTitle();
        this.message = notification.getMessage();
        this.type = notification.getType();
        this.category = notification.getCategory();

        this.isRead = notification.getIsRead();
        this.actionUrl = notification.getActionUrl();
        this.entityId = notification.getEntityId();
        this.entityType = notification.getEntityType();
        
        // Safely access user relationship
        try {
            this.userId = notification.getUser().getId();
            this.userName = notification.getUser().getFullName() != null ? 
                notification.getUser().getFullName() : notification.getUser().getUsername();
        } catch (Exception e) {
            // If user is not loaded, set default values
            this.userId = null;
            this.userName = "Unknown User";
        }
        
        this.userAvatar = null; // User model không có avatar field
        
        // Safely access store relationship
        try {
            this.storeId = notification.getStore() != null ? notification.getStore().getId() : null;
            this.storeName = notification.getStore() != null ? notification.getStore().getStoreName() : null;
        } catch (Exception e) {
            // If store is not loaded, set default values
            this.storeId = null;
            this.storeName = "Unknown Store";
        }
        
        this.createdBy = notification.getCreatedBy();
        
        // Lấy tên người tạo notification
        try {
            if (notification.getCreatedBy() != null) {
                // Nếu createdBy khác với userId (người nhận), thì cần lấy tên người tạo
                if (!notification.getCreatedBy().equals(notification.getUser().getId())) {
                    // TODO: Có thể cần query thêm để lấy tên người tạo
                    this.createdByUserName = "System";
                } else {
                    this.createdByUserName = this.userName; // Người tạo = người nhận
                }
            } else {
                this.createdByUserName = "System";
            }
        } catch (Exception e) {
            this.createdByUserName = "System";
        }
        
        this.createdAt = notification.getCreatedAt();
        this.readAt = notification.getReadAt();
    }
    

    
    // Constructor với tất cả fields (thay thế @AllArgsConstructor)
    public NotificationDto(Long id, String title, String message, Notification.NotificationType type,
                          Notification.NotificationCategory category, Boolean isRead,
                          String actionUrl, Long entityId, String entityType, Long userId, String userName,
                          String userAvatar, Long storeId, String storeName, Long createdBy, String createdByUserName, LocalDateTime createdAt, LocalDateTime readAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.type = type;
        this.category = category;
        this.isRead = isRead;
        this.actionUrl = actionUrl;
        this.entityId = entityId;
        this.entityType = entityType;
        this.userId = userId;
        this.userName = userName;
        this.userAvatar = userAvatar;
        this.storeId = storeId;
        this.storeName = storeName;
        this.createdBy = createdBy;
        this.createdByUserName = createdByUserName;
        this.createdAt = createdAt;
        this.readAt = readAt;
    }
    
    // Static factory method để tạo DTO an toàn từ entity
    public static NotificationDto fromEntity(Notification notification) {
        if (notification == null) {
            return null;
        }
        
        Long userId = null;
        String userName = "Unknown User";
        Long storeId = null;
        String storeName = "Unknown Store";
        
        // Safely access user relationship
        try {
            if (notification.getUser() != null) {
                userId = notification.getUser().getId();
                userName = notification.getUser().getFullName() != null ? 
                    notification.getUser().getFullName() : notification.getUser().getUsername();
            }
        } catch (Exception e) {
            // User relationship not loaded or accessible
        }
        
        // Safely access store relationship
        try {
            if (notification.getStore() != null) {
                storeId = notification.getStore().getId();
                storeName = notification.getStore().getStoreName();
            }
        } catch (Exception e) {
            // Store relationship not loaded or accessible
        }
        
        return new NotificationDto(
            notification.getId(),
            notification.getTitle(),
            notification.getMessage(),
            notification.getType(),
            notification.getCategory(),
            notification.getIsRead(),
            notification.getActionUrl(),
            notification.getEntityId(),
            notification.getEntityType(),
            userId,
            userName,
            null, // userAvatar
            storeId,
            storeName,
            notification.getCreatedBy(),
            "System", // createdByUserName - sẽ được cập nhật sau
            notification.getCreatedAt(),
            notification.getReadAt()
        );
    }
}
