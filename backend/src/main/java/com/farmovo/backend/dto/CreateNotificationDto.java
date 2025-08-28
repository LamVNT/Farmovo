package com.farmovo.backend.dto;

import com.farmovo.backend.models.Notification;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationDto {
    private String title;
    private String message;
    private Notification.NotificationType type;
    private Notification.NotificationCategory category;

    private String actionUrl;
    private Long entityId;
    private String entityType;
    private Long storeId;
}
