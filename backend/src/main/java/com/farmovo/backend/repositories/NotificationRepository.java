package com.farmovo.backend.repositories;

import com.farmovo.backend.models.Notification;
import com.farmovo.backend.models.Notification.NotificationCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Lấy tất cả notification của user theo store
    @EntityGraph(attributePaths = {"user", "store"})
    Page<Notification> findByUserIdAndStoreIdOrderByCreatedAtDesc(
        Long userId, Long storeId, Pageable pageable);
    
    // Lấy tất cả notification của user (không phân biệt store)
    @EntityGraph(attributePaths = {"user", "store"})
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    
    // Lấy số notification chưa đọc của user theo store
    Long countByUserIdAndStoreIdAndIsReadFalse(Long userId, Long storeId);
    
    // Lấy số notification chưa đọc của user (không phân biệt store)
    Long countByUserIdAndIsReadFalse(Long userId);
    
    // Lấy tất cả notification của store (cho Staff xem)
    @EntityGraph(attributePaths = {"user", "store"})
    Page<Notification> findByStoreIdOrderByCreatedAtDesc(Long storeId, Pageable pageable);
    
    // Lấy số notification chưa đọc của store (cho Staff xem)
    Long countByStoreIdAndIsReadFalse(Long storeId);
    
    // Lấy tất cả notification của tất cả store (cho Admin xem)
    @EntityGraph(attributePaths = {"user", "store"})
    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    // Lấy số notification chưa đọc của tất cả store (cho Admin xem)
    Long countByIsReadFalse();
    
    // Lấy notification theo category và store
    @EntityGraph(attributePaths = {"user", "store"})
    List<Notification> findByCategoryAndStoreIdOrderByCreatedAtDesc(
        NotificationCategory category, Long storeId);
    
    // Lấy notification theo entity
    @EntityGraph(attributePaths = {"user", "store"})
    List<Notification> findByEntityTypeAndEntityIdAndStoreId(
        String entityType, Long entityId, Long storeId);
    
    // Đánh dấu tất cả notification của user đã đọc
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.store.id = :storeId")
    void markAllAsReadByUserIdAndStoreId(@Param("userId") Long userId, @Param("storeId") Long storeId, @Param("readAt") LocalDateTime readAt);
    
    // Đánh dấu tất cả notification của user đã đọc (không phân biệt store)
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId")
    void markAllAsReadByUserId(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);
    
    // Đánh dấu tất cả notification của tất cả store đã đọc (cho Admin)
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt")
    void markAllNotificationsAsRead(@Param("readAt") LocalDateTime readAt);
    
    // Lấy notification theo thời gian tạo
    @EntityGraph(attributePaths = {"user", "store"})
    List<Notification> findByCreatedAtBetweenOrderByCreatedAtDesc(
        LocalDateTime startDate, LocalDateTime endDate);
    
    // Lấy notification theo ID với eager loading
    @EntityGraph(attributePaths = {"user", "store"})
    @Query("SELECT n FROM Notification n WHERE n.id = :id")
    Notification findByIdWithUserAndStore(@Param("id") Long id);
    
    // Xóa notification cũ hơn 30 ngày
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
}
