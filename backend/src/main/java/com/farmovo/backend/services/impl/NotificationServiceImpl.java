package com.farmovo.backend.services.impl;

import com.farmovo.backend.dto.CreateNotificationDto;
import com.farmovo.backend.dto.NotificationDto;
import com.farmovo.backend.models.Notification;
import com.farmovo.backend.models.Store;
import com.farmovo.backend.models.User;
import com.farmovo.backend.repositories.NotificationRepository;
import com.farmovo.backend.repositories.StoreRepository;
import com.farmovo.backend.repositories.UserRepository;
import com.farmovo.backend.services.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationServiceImpl implements NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private StoreRepository storeRepository;
    
    @Override
    @Transactional
    public NotificationDto createNotification(CreateNotificationDto dto, Long userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Store store = null;
            if (dto.getStoreId() != null) {
                store = storeRepository.findById(dto.getStoreId())
                    .orElse(null);
            }
            
            Notification notification = new Notification();
            notification.setTitle(dto.getTitle());
            notification.setMessage(dto.getMessage());
            notification.setType(dto.getType());
            notification.setCategory(dto.getCategory());

            notification.setActionUrl(dto.getActionUrl());
            notification.setEntityId(dto.getEntityId());
            notification.setEntityType(dto.getEntityType());
            notification.setUser(user);
            notification.setStore(store);
            notification.setIsRead(false);
            notification.setCreatedBy(userId); // Lưu user ID tạo notification
            // createdAt sẽ được tự động set bởi Base class
            
            Notification savedNotification = notificationRepository.save(notification);
            logger.info("Created notification: {} for user: {}", dto.getTitle(), userId);
            
            return NotificationDto.fromEntity(savedNotification);
        } catch (Exception e) {
            logger.error("Error creating notification: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create notification", e);
        }
    }
    
    @Override
    @Transactional
    public void createNotificationForAllUsersInStore(CreateNotificationDto dto, Long storeId) {
        try {
            Store store = storeRepository.findById(storeId)
                .orElseThrow(() -> new RuntimeException("Store not found"));
            
            // Lấy tất cả user trong store
            List<User> users = userRepository.findByStoreId(storeId);
            
            for (User user : users) {
                CreateNotificationDto userDto = new CreateNotificationDto();
                userDto.setTitle(dto.getTitle());
                userDto.setMessage(dto.getMessage());
                userDto.setType(dto.getType());
                userDto.setCategory(dto.getCategory());

                userDto.setActionUrl(dto.getActionUrl());
                userDto.setEntityId(dto.getEntityId());
                userDto.setEntityType(dto.getEntityType());
                userDto.setStoreId(storeId);
                
                createNotification(userDto, user.getId());
            }
            
            logger.info("Created notifications for {} users in store: {}", users.size(), storeId);
        } catch (Exception e) {
            logger.error("Error creating notifications for store: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create notifications for store", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getUserNotifications(Long userId, Long storeId, Pageable pageable) {
        try {
            Page<Notification> notifications;
            if (storeId != null) {
                notifications = notificationRepository.findByUserIdAndStoreIdOrderByCreatedAtDesc(userId, storeId, pageable);
            } else {
                notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
            }
            
            return notifications.map(NotificationDto::fromEntity);
        } catch (Exception e) {
            logger.error("Error getting user notifications: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get user notifications", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getStoreNotifications(Long storeId, Pageable pageable) {
        try {
            Page<Notification> notifications = notificationRepository.findByStoreIdOrderByCreatedAtDesc(storeId, pageable);
            return notifications.map(NotificationDto::fromEntity);
        } catch (Exception e) {
            logger.error("Error getting store notifications: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get store notifications", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationDto> getAllStoreNotifications(Pageable pageable) {
        try {
            Page<Notification> notifications = notificationRepository.findAllByOrderByCreatedAtDesc(pageable);
            return notifications.map(NotificationDto::fromEntity);
        } catch (Exception e) {
            logger.error("Error getting all store notifications: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get all store notifications", e);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Long getUnreadCount(Long userId, Long storeId) {
        try {
            if (storeId != null) {
                return notificationRepository.countByUserIdAndStoreIdAndIsReadFalse(userId, storeId);
            } else {
                return notificationRepository.countByUserIdAndIsReadFalse(userId);
            }
        } catch (Exception e) {
            logger.error("Error getting unread count: {}", e.getMessage(), e);
            return 0L;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Long getStoreUnreadCount(Long storeId) {
        try {
            return notificationRepository.countByStoreIdAndIsReadFalse(storeId);
        } catch (Exception e) {
            logger.error("Error getting store unread count: {}", e.getMessage(), e);
            return 0L;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Long getAllStoreUnreadCount() {
        try {
            return notificationRepository.countByIsReadFalse();
        } catch (Exception e) {
            logger.error("Error getting all store unread count: {}", e.getMessage(), e);
            return 0L;
        }
    }
    
    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        try {
            Notification notification = notificationRepository.findByIdWithUserAndStore(notificationId);
            if (notification == null) {
                throw new RuntimeException("Notification not found");
            }
            
            if (!notification.getUser().getId().equals(userId)) {
                throw new RuntimeException("Unauthorized access to notification");
            }
            
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            
            logger.info("Marked notification as read: {}", notificationId);
        } catch (Exception e) {
            logger.error("Error marking notification as read: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to mark notification as read", e);
        }
    }
    
    @Override
    @Transactional
    public void markAllAsRead(Long userId, Long storeId) {
        try {
            LocalDateTime now = LocalDateTime.now();
            if (storeId != null) {
                notificationRepository.markAllAsReadByUserIdAndStoreId(userId, storeId, now);
            } else {
                notificationRepository.markAllAsReadByUserId(userId, now);
            }
            
            logger.info("Marked all notifications as read for user: {}", userId);
        } catch (Exception e) {
            logger.error("Error marking all notifications as read: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to mark all notifications as read", e);
        }
    }

    @Override
    @Transactional
    public void markAllNotificationsAsRead() {
        try {
            LocalDateTime now = LocalDateTime.now();
            notificationRepository.markAllNotificationsAsRead(now);
            
            logger.info("Marked all notifications as read for all stores");
        } catch (Exception e) {
            logger.error("Error marking all notifications as read: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to mark all notifications as read", e);
        }
    }
    
    @Override
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        try {
            Notification notification = notificationRepository.findByIdWithUserAndStore(notificationId);
            if (notification == null) {
                throw new RuntimeException("Notification not found");
            }
            
            if (!notification.getUser().getId().equals(userId)) {
                throw new RuntimeException("Unauthorized access to notification");
            }
            
            notificationRepository.delete(notification);
            logger.info("Deleted notification: {}", notificationId);
        } catch (Exception e) {
            logger.error("Error deleting notification: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete notification", e);
        }
    }
    
    @Override
    @Transactional
    public void deleteAllUserNotifications(Long userId, Long storeId) {
        try {
            if (storeId != null) {
                List<Notification> notifications = notificationRepository.findByUserIdAndStoreIdOrderByCreatedAtDesc(userId, storeId, Pageable.unpaged()).getContent();
                notificationRepository.deleteAll(notifications);
            } else {
                List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged()).getContent();
                notificationRepository.deleteAll(notifications);
            }
            
            logger.info("Deleted all notifications for user: {}", userId);
        } catch (Exception e) {
            logger.error("Error deleting all notifications: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to delete all notifications", e);
        }
    }
    
    @Override
    @Scheduled(cron = "0 0 2 * * ?") // Chạy lúc 2h sáng mỗi ngày
    @Transactional
    public void cleanupOldNotifications() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
            notificationRepository.deleteOldNotifications(cutoffDate);
            logger.info("Cleaned up old notifications older than 30 days");
        } catch (Exception e) {
            logger.error("Error cleaning up old notifications: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void createImportTransactionNotification(String action, String transactionName, Long storeId, Long userId) {
        createImportTransactionNotification(action, transactionName, storeId, userId, null);
    }

    @Override
    public void createImportTransactionNotification(String action, String transactionName, Long storeId, Long userId, String newStatus) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String title = "Phiếu nhập hàng";
            
            // Xác định message dựa trên action
            String actionText = action;
            Notification.NotificationType notificationType = Notification.NotificationType.SUCCESS;
            
            if (action.equals("delete") || action.equals("cancel")) {
                actionText = action.equals("delete") ? "xóa" : "hủy";
                notificationType = Notification.NotificationType.WARNING;
            } else if (action.equals("status_change")) {
                // Xác định trạng thái cụ thể
                if (newStatus != null && !newStatus.isEmpty()) {
                    switch (newStatus.toLowerCase()) {
                        case "open":
                        case "opened":
                            actionText = "chuyển trạng thái mở";
                            break;
                        case "closed":
                        case "close":
                            actionText = "chuyển trạng thái đóng";
                            break;
                        case "completed":
                        case "complete":
                            actionText = "chuyển trạng thái hoàn thành";
                            break;
                        case "cancelled":
                        case "cancel":
                            actionText = "chuyển trạng thái hủy";
                            break;
                        case "pending":
                            actionText = "chuyển trạng thái chờ xử lý";
                            break;
                        case "processing":
                            actionText = "chuyển trạng thái đang xử lý";
                            break;
                        case "draft":
                            actionText = "chuyển trạng thái nháp";
                            break;
                        case "waiting_for_approve":
                            actionText = "chuyển trạng thái chờ xác nhận";
                            break;
                        case "submitted":
                            actionText = "chuyển trạng thái đã gửi";
                            break;
                        case "approved":
                            actionText = "chuyển trạng thái đã duyệt";
                            break;
                        case "rejected":
                            actionText = "chuyển trạng thái từ chối";
                            break;
                        default:
                            actionText = "chuyển sang trạng thái " + newStatus;
                    }
                } else {
                    actionText = "thay đổi trạng thái";
                }
                notificationType = Notification.NotificationType.INFO;
            } else if (action.equals("complete")) {
                actionText = "hoàn thành";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("update")) {
                actionText = "cập nhật";
                notificationType = Notification.NotificationType.INFO;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("delete")) {
                actionText = "xóa";
                notificationType = Notification.NotificationType.WARNING;
            }
            
            String message = String.format("Đã %s phiếu nhập hàng: %s bởi %s", actionText, transactionName, user.getFullName() != null ? user.getFullName() : user.getUsername());
            
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle(title);
            dto.setMessage(message);
            dto.setType(notificationType);
            dto.setCategory(Notification.NotificationCategory.IMPORT_TRANSACTION);
            dto.setStoreId(storeId);
            
            createNotification(dto, userId);
        } catch (Exception e) {
            logger.error("Error creating import transaction notification: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void createSaleTransactionNotification(String action, String transactionName, Long storeId, Long userId) {
        createSaleTransactionNotification(action, transactionName, storeId, userId, null);
    }

    @Override
    public void createSaleTransactionNotification(String action, String transactionName, Long storeId, Long userId, String newStatus) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String title = "Phiếu bán hàng";
            
            // Xác định message dựa trên action
            String actionText = action;
            Notification.NotificationType notificationType = Notification.NotificationType.SUCCESS;
            
            if (action.equals("delete") || action.equals("cancel")) {
                actionText = action.equals("delete") ? "xóa" : "hủy";
                notificationType = Notification.NotificationType.WARNING;
            } else if (action.equals("status_change")) {
                // Xác định trạng thái cụ thể
                if (newStatus != null && !newStatus.isEmpty()) {
                    switch (newStatus.toLowerCase()) {
                        case "open":
                        case "opened":
                            actionText = "chuyển trạng thái mở";
                            break;
                        case "closed":
                        case "close":
                            actionText = "chuyển trạng thái đóng";
                            break;
                        case "completed":
                        case "complete":
                            actionText = "chuyển trạng thái hoàn thành";
                            break;
                        case "cancelled":
                        case "cancel":
                            actionText = "chuyển trạng thái hủy";
                            break;
                        case "pending":
                            actionText = "chuyển trạng thái chờ xử lý";
                            break;
                        case "processing":
                            actionText = "chuyển trạng thái đang xử lý";
                            break;
                        case "draft":
                            actionText = "chuyển trạng thái nháp";
                            break;
                        case "waiting_for_approve":
                            actionText = "chuyển trạng thái chờ xác nhận";
                            break;
                        case "submitted":
                            actionText = "chuyển trạng thái đã gửi";
                            break;
                        case "approved":
                            actionText = "chuyển trạng thái đã duyệt";
                            break;
                        case "rejected":
                            actionText = "chuyển trạng thái từ chối";
                            break;
                        default:
                            actionText = "chuyển sang trạng thái " + newStatus;
                    }
                } else {
                    actionText = "thay đổi trạng thái";
                }
                notificationType = Notification.NotificationType.INFO;
            } else if (action.equals("complete")) {
                actionText = "hoàn thành";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("update")) {
                actionText = "cập nhật";
                notificationType = Notification.NotificationType.INFO;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("delete")) {
                actionText = "xóa";
                notificationType = Notification.NotificationType.WARNING;
            }
            
            String message = String.format("Đã %s phiếu bán hàng: %s bởi %s", actionText, transactionName, user.getFullName() != null ? user.getFullName() : user.getUsername());
            
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle(title);
            dto.setMessage(message);
            dto.setType(notificationType);
            dto.setCategory(Notification.NotificationCategory.SALE_TRANSACTION);
            dto.setStoreId(storeId);
            
            createNotification(dto, userId);
        } catch (Exception e) {
            logger.error("Error creating sale transaction notification: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void createProductNotification(String action, String productName, Long storeId, Long userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String title = "Sản phẩm";
            
            // Xác định message dựa trên action
            String actionText = action;
            Notification.NotificationType notificationType = Notification.NotificationType.INFO;
            
            if (action.equals("delete")) {
                actionText = "xóa";
                notificationType = Notification.NotificationType.WARNING;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("update")) {
                actionText = "cập nhật";
                notificationType = Notification.NotificationType.INFO;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("delete")) {
                actionText = "xóa";
                notificationType = Notification.NotificationType.WARNING;
            }
            
            String message = String.format("Đã %s sản phẩm: %s bởi %s", actionText, productName, user.getFullName() != null ? user.getFullName() : user.getUsername());
            
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle(title);
            dto.setMessage(message);
            dto.setType(notificationType);
            dto.setCategory(Notification.NotificationCategory.PRODUCT);
            dto.setStoreId(storeId);
            
            createNotification(dto, userId);
        } catch (Exception e) {
            logger.error("Error creating product notification: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void createCustomerNotification(String action, String customerName, Long storeId, Long userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String title = "Khách hàng";
            
            // Xác định message dựa trên action
            String actionText = action;
            Notification.NotificationType notificationType = Notification.NotificationType.INFO;
            
            if (action.equals("delete")) {
                actionText = "xóa";
                notificationType = Notification.NotificationType.WARNING;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("update")) {
                actionText = "cập nhật";
                notificationType = Notification.NotificationType.INFO;
            }
            
            String message = String.format("Đã %s khách hàng: %s bởi %s", actionText, customerName, user.getFullName() != null ? user.getFullName() : user.getUsername());
            
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle(title);
            dto.setMessage(message);
            dto.setType(notificationType);
            dto.setCategory(Notification.NotificationCategory.CUSTOMER);
            dto.setStoreId(storeId);
            
            createNotification(dto, userId);
        } catch (Exception e) {
            logger.error("Error creating customer notification: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void createStocktakeNotification(String action, String stocktakeName, Long storeId, Long userId) {
        // Gọi method overloaded với newStatus = null
        createStocktakeNotification(action, stocktakeName, storeId, userId, null);
    }

    @Override
    public void createStocktakeNotification(String action, String stocktakeName, Long storeId, Long userId, String newStatus) {
        try {
            logger.info("Creating stocktake notification - action: {}, stocktakeName: {}, storeId: {}, userId: {}, newStatus: {}", 
                action, stocktakeName, storeId, userId, newStatus);
            
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String title = "Kiểm kê";
            
            // Xác định message dựa trên action và trạng thái
            String actionText = action;
            Notification.NotificationType notificationType = Notification.NotificationType.WARNING;
            
            if (action.equals("delete")) {
                actionText = "xóa";
                notificationType = Notification.NotificationType.ERROR;
            } else if (action.equals("create")) {
                if ("DRAFT".equals(newStatus)) {
                    actionText = "tạo nháp";
                } else if ("COMPLETED".equals(newStatus)) {
                    actionText = "hoàn thành";
                } else {
                    actionText = "tạo";
                }
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("update")) {
                if ("DRAFT".equals(newStatus)) {
                    actionText = "cập nhật nháp";
                } else if ("COMPLETED".equals(newStatus)) {
                    actionText = "hoàn thành";
                } else {
                    actionText = "cập nhật";
                }
                notificationType = Notification.NotificationType.INFO;
            } else if (action.equals("cancel")) {
                actionText = "hủy";
                notificationType = Notification.NotificationType.WARNING;
            } else if (action.equals("status_change")) {
                if ("DRAFT".equals(newStatus)) {
                    actionText = "chuyển trạng thái nháp";
                } else if ("COMPLETED".equals(newStatus)) {
                    actionText = "chuyển trạng thái hoàn thành";
                } else if ("CANCELLED".equals(newStatus)) {
                    actionText = "chuyển trạng thái hủy";
                } else {
                    actionText = "chuyển trạng thái";
                }
                notificationType = Notification.NotificationType.INFO;
            } else if (action.equals("balance_required")) {
                actionText = "cần cân bằng kho";
                notificationType = Notification.NotificationType.WARNING;
                logger.info("Processing balance_required action for stocktake: {}", stocktakeName);
            }
            
            String message;
            if (action.equals("balance_required")) {
                message = String.format("⚠️ Phiếu kiểm kê %s có chênh lệch số lượng, cần cân bằng kho bởi %s", stocktakeName, user.getFullName() != null ? user.getFullName() : user.getUsername());
                logger.info("Generated balance_required message: {}", message);
            } else {
                message = String.format("Đã %s phiếu kiểm kê: %s bởi %s", actionText, stocktakeName, user.getFullName() != null ? user.getFullName() : user.getUsername());
            }
            
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle(title);
            dto.setMessage(message);
            dto.setType(notificationType);
            dto.setCategory(Notification.NotificationCategory.STOCKTAKE);
            dto.setStoreId(storeId);
            
            logger.info("About to create notification with DTO: title={}, message={}, type={}, category={}, storeId={}", 
                dto.getTitle(), dto.getMessage(), dto.getType(), dto.getCategory(), dto.getStoreId());
            
            createNotification(dto, userId);
        } catch (Exception e) {
            logger.error("Error creating stocktake notification: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void createCategoryNotification(String action, String categoryName, Long storeId, Long userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String title = "Danh mục";
            
            // Xác định message dựa trên action
            String actionText = action;
            Notification.NotificationType notificationType = Notification.NotificationType.INFO;
            
            if (action.equals("delete")) {
                actionText = "xóa";
                notificationType = Notification.NotificationType.WARNING;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("update")) {
                actionText = "cập nhật";
                notificationType = Notification.NotificationType.INFO;
            }
            
            String message = String.format("Đã %s danh mục: %s bởi %s", actionText, categoryName, user.getFullName() != null ? user.getFullName() : user.getUsername());
            
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle(title);
            dto.setMessage(message);
            dto.setType(notificationType);
            dto.setCategory(Notification.NotificationCategory.CATEGORY);
            dto.setStoreId(storeId);
            
            createNotification(dto, userId);
        } catch (Exception e) {
            logger.error("Error creating category notification: {}", e.getMessage(), e);
        }
    }
    
    @Override
    public void createZoneNotification(String action, String zoneName, Long storeId, Long userId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String title = "Khu vực";
            
            // Xác định message dựa trên action
            String actionText = action;
            Notification.NotificationType notificationType = Notification.NotificationType.INFO;
            
            if (action.equals("delete")) {
                actionText = "xóa";
                notificationType = Notification.NotificationType.WARNING;
            } else if (action.equals("create")) {
                actionText = "tạo";
                notificationType = Notification.NotificationType.SUCCESS;
            } else if (action.equals("update")) {
                actionText = "cập nhật";
                notificationType = Notification.NotificationType.INFO;
            }
            
            String message = String.format("Đã %s khu vực: %s bởi %s", actionText, zoneName, user.getFullName() != null ? user.getFullName() : user.getUsername());
            
            CreateNotificationDto dto = new CreateNotificationDto();
            dto.setTitle(title);
            dto.setMessage(message);
            dto.setType(notificationType);
            dto.setCategory(Notification.NotificationCategory.ZONE);
            dto.setStoreId(storeId);
            
            createNotification(dto, userId);
        } catch (Exception e) {
            logger.error("Error creating zone notification: {}", e.getMessage(), e);
        }
    }
}
