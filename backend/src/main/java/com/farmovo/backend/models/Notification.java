package com.farmovo.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Notification extends Base {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @Column(name = "title", nullable = false)
    private String title;
    
    @Column(name = "message", nullable = false, length = 1000)
    private String message;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private NotificationCategory category;
    

    
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;
    
    @Column(name = "action_url", length = 500)
    private String actionUrl;
    
    @Column(name = "entity_id")
    private Long entityId;
    
    @Column(name = "entity_type", length = 100)
    private String entityType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "store_id")
    private Store store;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    public enum NotificationType {
        SUCCESS, ERROR, WARNING, INFO
    }
    
    public enum NotificationCategory {
        IMPORT_TRANSACTION, SALE_TRANSACTION, PRODUCT, CUSTOMER, 
        STOCKTAKE, USER, STORE, CATEGORY, ZONE, DEBT_NOTE, GENERAL
    }
}
