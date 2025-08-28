package com.farmovo.backend.services;

import com.farmovo.backend.dto.CreateNotificationDto;
import com.farmovo.backend.dto.NotificationDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    
        // Tạo notification mới
    NotificationDto createNotification(CreateNotificationDto dto, Long userId);
    
    // Tạo notification cho tất cả user trong store
    void createNotificationForAllUsersInStore(CreateNotificationDto dto, Long storeId);
    
    // Lấy tất cả notification của user
    Page<NotificationDto> getUserNotifications(Long userId, Long storeId, Pageable pageable);
    
    // Lấy tất cả notification của store (cho Staff xem)
    Page<NotificationDto> getStoreNotifications(Long storeId, Pageable pageable);
    
    // Lấy tất cả notification của tất cả store (cho Admin xem)
    Page<NotificationDto> getAllStoreNotifications(Pageable pageable);
    
    // Lấy số notification chưa đọc của user
    Long getUnreadCount(Long userId, Long storeId);
    
    // Lấy số notification chưa đọc của store (cho Staff xem)
    Long getStoreUnreadCount(Long storeId);
    
    // Lấy số notification chưa đọc của tất cả store (cho Admin xem)
    Long getAllStoreUnreadCount();
    
    // Đánh dấu notification đã đọc
    void markAsRead(Long notificationId, Long userId);
    
    // Đánh dấu tất cả notification đã đọc
    void markAllAsRead(Long userId, Long storeId);
    
    // Đánh dấu tất cả notification của tất cả store đã đọc (cho Admin)
    void markAllNotificationsAsRead();
    
    // Xóa notification
    void deleteNotification(Long notificationId, Long userId);
    
    // Xóa tất cả notification của user
    void deleteAllUserNotifications(Long userId, Long storeId);
    
    // Xóa notification cũ (scheduled task)
    void cleanupOldNotifications();
    
    // Tạo notification cho các thao tác phổ biến
    void createImportTransactionNotification(String action, String transactionName, Long storeId, Long userId);
    void createImportTransactionNotification(String action, String transactionName, Long storeId, Long userId, String newStatus);
    
    void createSaleTransactionNotification(String action, String transactionName, Long storeId, Long userId);
    void createSaleTransactionNotification(String action, String transactionName, Long storeId, Long userId, String newStatus);
    
    void createProductNotification(String action, String productName, Long storeId, Long userId);
    
    void createCustomerNotification(String action, String customerName, Long storeId, Long userId);
    
    void createStocktakeNotification(String action, String stocktakeName, Long storeId, Long userId);
    void createStocktakeNotification(String action, String stocktakeName, Long storeId, Long userId, String newStatus);
    
    // Tạo notification cho Category (Danh mục)
    void createCategoryNotification(String action, String categoryName, Long storeId, Long userId);
    
    // Tạo notification cho Zone (Khu vực)
    void createZoneNotification(String action, String zoneName, Long storeId, Long userId);
}
