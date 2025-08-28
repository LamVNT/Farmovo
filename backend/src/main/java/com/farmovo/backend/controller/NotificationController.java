package com.farmovo.backend.controller;

import com.farmovo.backend.dto.CreateNotificationDto;
import com.farmovo.backend.dto.NotificationDto;
import com.farmovo.backend.models.Notification;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", allowCredentials = "true")
public class NotificationController {
    
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    
    // Lấy tất cả notification của user hiện tại
    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long storeId) {
        
        try {
            log.info("Getting notifications for page: {}, size: {}, storeId: {}", page, size, storeId);
            
            Long userId = getCurrentUserId();
            log.info("Current user ID: {}", userId);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            
            Page<NotificationDto> notifications = notificationService.getUserNotifications(userId, storeId, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("notifications", notifications.getContent());
            response.put("currentPage", notifications.getNumber());
            response.put("totalItems", notifications.getTotalElements());
            response.put("totalPages", notifications.getTotalPages());
            response.put("size", notifications.getSize());
            
            log.info("Successfully retrieved {} notifications", notifications.getTotalElements());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting user notifications: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Lấy tất cả notification của store (cho Staff xem)
    @GetMapping("/store")
    public ResponseEntity<Map<String, Object>> getStoreNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam Long storeId) {
        
        try {
            log.info("Getting store notifications for page: {}, size: {}, storeId: {}", page, size, storeId);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            
            Page<NotificationDto> notifications = notificationService.getStoreNotifications(storeId, pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("notifications", notifications.getContent());
            response.put("currentPage", notifications.getNumber());
            response.put("totalItems", notifications.getTotalElements());
            response.put("totalPages", notifications.getTotalPages());
            response.put("size", notifications.getSize());
            
            log.info("Successfully retrieved {} store notifications", notifications.getTotalElements());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting store notifications: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Lấy tất cả notification của tất cả store (cho Admin xem)
    @GetMapping("/all-stores")
    public ResponseEntity<Map<String, Object>> getAllStoreNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        try {
            log.info("Getting all store notifications for page: {}, size: {}", page, size);
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            
            Page<NotificationDto> notifications = notificationService.getAllStoreNotifications(pageable);
            
            Map<String, Object> response = new HashMap<>();
            response.put("notifications", notifications.getContent());
            response.put("currentPage", notifications.getNumber());
            response.put("totalItems", notifications.getTotalElements());
            response.put("totalPages", notifications.getTotalPages());
            response.put("size", notifications.getSize());
            
            log.info("Successfully retrieved {} all store notifications", notifications.getTotalElements());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting all store notifications: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Lấy số notification chưa đọc của user
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@RequestParam(required = false) Long storeId) {
        try {
            Long userId = getCurrentUserId();
            Long count = notificationService.getUnreadCount(userId, storeId);
            
            return ResponseEntity.ok(Map.of("unreadCount", count));
        } catch (Exception e) {
            log.error("Error getting unread count: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Lấy số notification chưa đọc của store (cho Staff xem)
    @GetMapping("/store/unread-count")
    public ResponseEntity<Map<String, Object>> getStoreUnreadCount(@RequestParam Long storeId) {
        try {
            Long count = notificationService.getStoreUnreadCount(storeId);
            
            return ResponseEntity.ok(Map.of("unreadCount", count));
        } catch (Exception e) {
            log.error("Error getting store unread count: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Lấy số notification chưa đọc của tất cả store (cho Admin xem)
    @GetMapping("/all-stores/unread-count")
    public ResponseEntity<Map<String, Object>> getAllStoreUnreadCount() {
        try {
            Long count = notificationService.getAllStoreUnreadCount();
            
            return ResponseEntity.ok(Map.of("unreadCount", count));
        } catch (Exception e) {
            log.error("Error getting all store unread count: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Đánh dấu notification đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            notificationService.markAsRead(id, userId);
            
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            log.error("Error marking notification as read: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Đánh dấu tất cả notification đã đọc
    @PutMapping("/mark-all-read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@RequestParam(required = false) Long storeId) {
        try {
            Long userId = getCurrentUserId();
            notificationService.markAllAsRead(userId, storeId);
            
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            log.error("Error marking all notifications as read: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Đánh dấu tất cả notification của tất cả store đã đọc (cho Admin)
    @PutMapping("/mark-all-notifications-read")
    public ResponseEntity<Map<String, Object>> markAllNotificationsAsRead() {
        try {
            notificationService.markAllNotificationsAsRead();
            
            return ResponseEntity.ok(Map.of("message", "All notifications of all stores marked as read"));
        } catch (Exception e) {
            log.error("Error marking all notifications as read: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Xóa notification
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNotification(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            notificationService.deleteNotification(id, userId);
            
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        } catch (Exception e) {
            log.error("Error deleting notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Xóa tất cả notification của user
    @DeleteMapping("/delete-all")
    public ResponseEntity<Map<String, Object>> deleteAllNotifications(@RequestParam(required = false) Long storeId) {
        try {
            Long userId = getCurrentUserId();
            notificationService.deleteAllUserNotifications(userId, storeId);
            
            return ResponseEntity.ok(Map.of("message", "All notifications deleted"));
        } catch (Exception e) {
            log.error("Error deleting all notifications: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Tạo notification mới (cho admin hoặc system)
    @PostMapping
    public ResponseEntity<Map<String, Object>> createNotification(@RequestBody CreateNotificationDto dto) {
        try {
            Long userId = getCurrentUserId();
            NotificationDto notification = notificationService.createNotification(dto, userId);
            
            return ResponseEntity.ok(Map.of("notification", notification));
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Tạo notification cho tất cả user trong store
    @PostMapping("/store/{storeId}")
    public ResponseEntity<Map<String, Object>> createNotificationForStore(
            @PathVariable Long storeId, 
            @RequestBody CreateNotificationDto dto) {
        try {
            notificationService.createNotificationForAllUsersInStore(dto, storeId);
            
            return ResponseEntity.ok(Map.of("message", "Notifications created for all users in store"));
        } catch (Exception e) {
            log.error("Error creating notifications for store: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Test endpoint để tạo notification
    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> createTestNotification() {
        try {
            Long userId = getCurrentUserId();
            Long storeId = 2L; // Store ID từ frontend
            
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle("Test Notification");
            dto.setMessage("Đây là notification test để kiểm tra hệ thống");
            dto.setType(Notification.NotificationType.INFO);
            dto.setCategory(Notification.NotificationCategory.GENERAL);
            dto.setStoreId(storeId);
            
            NotificationDto notification = notificationService.createNotification(dto, userId);
            
            return ResponseEntity.ok(Map.of("notification", notification, "message", "Test notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating test notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Simple test endpoint để kiểm tra authentication
    @GetMapping("/test-auth")
    public ResponseEntity<Map<String, Object>> testAuthentication() {
        try {
            log.info("Testing authentication...");
            Long userId = getCurrentUserId();
            log.info("Authentication successful, user ID: {}", userId);
            
            return ResponseEntity.ok(Map.of(
                "message", "Authentication successful",
                "userId", userId,
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            log.error("Authentication test failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Test endpoint để kiểm tra notifications cơ bản
    @GetMapping("/test-basic")
    public ResponseEntity<Map<String, Object>> testBasicNotifications() {
        try {
            log.info("Testing basic notifications...");
            Long userId = getCurrentUserId();
            log.info("Current user ID: {}", userId);
            
            // Tạo một notification test đơn giản
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle("Test Basic Notification");
            dto.setMessage("Đây là notification test cơ bản");
            dto.setType(Notification.NotificationType.INFO);
            dto.setCategory(Notification.NotificationCategory.GENERAL);
            dto.setStoreId(2L);
            
            NotificationDto notification = notificationService.createNotification(dto, userId);
            log.info("Created test notification: {}", notification.getId());
            
            // Lấy notifications của user
            Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
            Page<NotificationDto> notifications = notificationService.getUserNotifications(userId, 2L, pageable);
            
            return ResponseEntity.ok(Map.of(
                "message", "Basic notification test successful",
                "userId", userId,
                "testNotification", notification,
                "totalNotifications", notifications.getTotalElements(),
                "notifications", notifications.getContent()
            ));
        } catch (Exception e) {
            log.error("Basic notification test failed: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // Tạo notification cho import transaction
    @PostMapping("/import-transaction")
    public ResponseEntity<Map<String, Object>> createImportTransactionNotification(
            @RequestBody Map<String, Object> request) {
        try {
            String action = (String) request.get("action");
            String transactionName = (String) request.get("transactionName");
            Long storeId = Long.valueOf(request.get("storeId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            String newStatus = (String) request.get("newStatus");
            
            // Gọi trực tiếp method trong service
            if (newStatus != null && !newStatus.isEmpty()) {
                notificationService.createImportTransactionNotification(action, transactionName, storeId, userId, newStatus);
            } else {
                notificationService.createImportTransactionNotification(action, transactionName, storeId, userId);
            }
            
            return ResponseEntity.ok(Map.of("message", "Import transaction notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating import transaction notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Tạo notification cho sale transaction
    @PostMapping("/sale-transaction")
    public ResponseEntity<Map<String, Object>> createSaleTransactionNotification(
            @RequestBody Map<String, Object> request) {
        try {
            String action = (String) request.get("action");
            String transactionName = (String) request.get("transactionName");
            Long storeId = Long.valueOf(request.get("storeId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            String newStatus = (String) request.get("newStatus");
            
            // Gọi trực tiếp method trong service
            if (newStatus != null && !newStatus.isEmpty()) {
                notificationService.createSaleTransactionNotification(action, transactionName, storeId, userId, newStatus);
            } else {
                notificationService.createSaleTransactionNotification(action, transactionName, storeId, userId);
            }
            
            return ResponseEntity.ok(Map.of("message", "Sale transaction notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating sale transaction notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Tạo notification cho product
    @PostMapping("/product")
    public ResponseEntity<Map<String, Object>> createProductNotification(
            @RequestBody Map<String, Object> request) {
        try {
            String action = (String) request.get("action");
            String productName = (String) request.get("productName");
            Long storeId = Long.valueOf(request.get("storeId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            
            notificationService.createProductNotification(action, productName, storeId, userId);
            
            return ResponseEntity.ok(Map.of("message", "Product notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating product notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Tạo notification cho customer
    @PostMapping("/customer")
    public ResponseEntity<Map<String, Object>> createCustomerNotification(
            @RequestBody Map<String, Object> request) {
        try {
            String action = (String) request.get("action");
            String customerName = (String) request.get("customerName");
            Long storeId = Long.valueOf(request.get("storeId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            
            notificationService.createCustomerNotification(action, customerName, storeId, userId);
            
            return ResponseEntity.ok(Map.of("message", "Customer notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating customer notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Tạo notification cho stocktake
    @PostMapping("/stocktake")
    public ResponseEntity<Map<String, Object>> createStocktakeNotification(
            @RequestBody Map<String, Object> request) {
        try {
            String action = (String) request.get("action");
            String stocktakeName = (String) request.get("stocktakeName");
            Long storeId = Long.valueOf(request.get("storeId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            String newStatus = (String) request.get("newStatus");
            
            if (newStatus != null) {
                notificationService.createStocktakeNotification(action, stocktakeName, storeId, userId, newStatus);
            } else {
                notificationService.createStocktakeNotification(action, stocktakeName, storeId, userId);
            }
            
            return ResponseEntity.ok(Map.of("message", "Stocktake notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating stocktake notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Tạo notification cho category
    @PostMapping("/category")
    public ResponseEntity<Map<String, Object>> createCategoryNotification(
            @RequestBody Map<String, Object> request) {
        try {
            String action = (String) request.get("action");
            String categoryName = (String) request.get("categoryName");
            Long storeId = Long.valueOf(request.get("storeId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            
            notificationService.createCategoryNotification(action, categoryName, storeId, userId);
            
            return ResponseEntity.ok(Map.of("message", "Category notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating category notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Tạo notification cho zone
    @PostMapping("/zone")
    public ResponseEntity<Map<String, Object>> createZoneNotification(
            @RequestBody Map<String, Object> request) {
        try {
            String action = (String) request.get("action");
            String zoneName = (String) request.get("zoneName");
            Long storeId = Long.valueOf(request.get("storeId").toString());
            Long userId = Long.valueOf(request.get("userId").toString());
            
            notificationService.createZoneNotification(action, zoneName, storeId, userId);
            
            return ResponseEntity.ok(Map.of("message", "Zone notification created successfully"));
        } catch (Exception e) {
            log.error("Error creating zone notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Helper method để lấy user ID hiện tại
    private Long getCurrentUserId() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            log.info("Authentication found: {}", authentication != null ? "YES" : "NO");
            
            if (authentication != null) {
                String principalClassName = authentication.getPrincipal().getClass().getSimpleName();
                log.info("Authentication principal class: {}", principalClassName);
                
                if (authentication.getPrincipal() instanceof org.springframework.security.core.userdetails.UserDetails) {
                    String username = authentication.getName();
                    log.info("Username from authentication: {}", username);
                    
                    try {
                        // Lấy user ID từ username
                        User user = userRepository.findByUsername(username)
                            .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
                        log.info("Found user: ID={}, username={}", user.getId(), user.getUsername());
                        return user.getId();
                    } catch (Exception e) {
                        log.error("Error getting user ID for username {}: {}", username, e.getMessage(), e);
                        // Fallback: return 1L nếu không lấy được user ID
                        log.warn("Falling back to user ID 1L");
                        return 1L;
                    }
                } else {
                    log.warn("Principal is not UserDetails, principal class: {}", principalClassName);
                    // Fallback: return 1L nếu không phải UserDetails
                    return 1L;
                }
            } else {
                log.warn("No authentication found, falling back to user ID 1L");
                return 1L;
            }
        } catch (Exception e) {
            log.error("Unexpected error in getCurrentUserId: {}", e.getMessage(), e);
            return 1L;
        }
    }
}
