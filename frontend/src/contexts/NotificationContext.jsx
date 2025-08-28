import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthorizationContext';
import { useStoreSelection } from './StoreSelectionContext';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { selectedStore } = useStoreSelection();

    // Load notifications từ database
    const loadNotifications = useCallback(async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            const storeId = selectedStore?.id;
            
            // Nếu là Staff, lấy tất cả thông báo của store
            // Nếu là Admin/Owner, lấy thông báo của user
            let response, count;
            
            if (user.roles && user.roles.includes('STAFF')) {
                // Staff: xem tất cả thông báo của store
                response = await notificationService.getStoreNotifications(0, 50, storeId);
                count = await notificationService.getStoreUnreadCount(storeId);
            } else {
                // Admin/Owner: xem tất cả thông báo của tất cả store
                response = await notificationService.getAllStoreNotifications(0, 50);
                count = await notificationService.getAllStoreUnreadCount();
            }
            
            setNotifications(response.notifications || []);
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user, selectedStore?.id]);

    // Load notifications khi user hoặc store thay đổi
    useEffect(() => {
        if (user) {
            loadNotifications();
        }
    }, [user, selectedStore?.id]);

    // Refresh notifications
    const refreshNotifications = useCallback(() => {
        if (user) {
            loadNotifications();
        }
    }, [user, loadNotifications]);

    // Đánh dấu notification đã đọc
    const markAsRead = useCallback(async (id) => {
        try {
            await notificationService.markAsRead(id);
        setNotifications(prev => 
            prev.map(n => 
                    n.id === id ? { ...n, isRead: true } : n
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    // Đánh dấu tất cả đã đọc
    const markAllAsRead = useCallback(async () => {
        try {
            const storeId = selectedStore?.id;
            
            // Nếu là Staff, đánh dấu tất cả thông báo của store
            // Nếu là Admin/Owner, đánh dấu tất cả thông báo của tất cả store
            if (user.roles && user.roles.includes('STAFF')) {
                // Staff: đánh dấu tất cả thông báo của store
                await notificationService.markAllAsRead(storeId);
            } else {
                // Admin/Owner: đánh dấu tất cả thông báo của tất cả store
                await notificationService.markAllNotificationsAsRead();
            }
            
            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [selectedStore, user]);

    // Xóa tất cả notifications
    const clearAllNotifications = useCallback(async () => {
        try {
            const storeId = selectedStore?.id;
            await notificationService.deleteAllNotifications(storeId);
        setNotifications([]);
        setUnreadCount(0);
        } catch (error) {
            console.error('Error clearing all notifications:', error);
        }
    }, [selectedStore]);

    // Tạo notification cho các thao tác phổ biến (gọi API backend)
    // Helper function để xác định trạng thái tiếng Việt
    const getStatusText = useCallback((status) => {
        if (!status) return 'thay đổi trạng thái';
        
        switch (status.toLowerCase()) {
            case 'open':
            case 'opened':
                return 'mở';
            case 'closed':
            case 'close':
                return 'đóng';
            case 'completed':
            case 'complete':
                return 'hoàn thành';
            case 'cancelled':
            case 'cancel':
                return 'hủy';
            case 'pending':
                return 'chờ xử lý';
            case 'processing':
                return 'đang xử lý';
            case 'draft':
                return 'nháp';
            case 'submitted':
                return 'đã gửi';
            case 'approved':
                return 'đã duyệt';
            case 'rejected':
                return 'từ chối';
            default:
                return `chuyển sang trạng thái ${status}`;
        }
    }, []);

    const createImportTransactionNotification = useCallback(async (action, transactionName, newStatus = null) => {
        if (!user || !selectedStore) return;
        
        try {
            // Gọi backend method để tạo notification với logic xử lý trạng thái
            await notificationService.createImportTransactionNotification(action, transactionName, selectedStore.id, user.id, newStatus);
            
            // Refresh notifications sau khi tạo
            await loadNotifications();
        } catch (error) {
            console.error('Error creating import transaction notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const createSaleTransactionNotification = useCallback(async (action, transactionName, newStatus = null) => {
        if (!user || !selectedStore) return;
        
        try {
            // Gọi backend method để tạo notification với logic xử lý trạng thái
            await notificationService.createSaleTransactionNotification(action, transactionName, selectedStore.id, user.id, newStatus);
            
            // Refresh notifications sau khi tạo
            await loadNotifications();
        } catch (error) {
            console.error('Error creating sale transaction notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const createProductNotification = useCallback(async (action, productName) => {
        if (!user || !selectedStore) return;
        
        try {
            // Xác định type dựa trên action
            let notificationType = 'INFO';
            let actionText = action;
            
            if (action === 'delete') {
                notificationType = 'WARNING';
                actionText = 'xóa';
            } else if (action === 'create') {
                notificationType = 'SUCCESS';
                actionText = 'tạo';
            } else if (action === 'update') {
                notificationType = 'INFO';
                actionText = 'cập nhật';
            }
            
            // Gọi backend method để tạo notification
            await notificationService.createProductNotification(action, productName, selectedStore.id, user.id);
            
            // Refresh notifications sau khi tạo
            await loadNotifications();
        } catch (error) {
            console.error('Error creating product notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const createCustomerNotification = useCallback(async (action, customerName) => {
        if (!user || !selectedStore) return;
        
        try {
            // Xác định type dựa trên action
            let notificationType = 'INFO';
            let actionText = action;
            
            if (action === 'delete') {
                notificationType = 'WARNING';
                actionText = 'xóa';
            } else if (action === 'create') {
                notificationType = 'SUCCESS';
                actionText = 'tạo';
            } else if (action === 'update') {
                notificationType = 'INFO';
                actionText = 'cập nhật';
            }
            
            const notificationData = {
            title: 'Khách hàng',
                message: `Đã ${actionText} khách hàng: ${customerName}`,
                type: notificationType,
                category: 'CUSTOMER',

                storeId: selectedStore.id
            };
            
            // Gọi backend method để tạo notification
            await notificationService.createCustomerNotification(action, customerName, selectedStore.id, user.id);
            
            // Refresh notifications sau khi tạo
            await loadNotifications();
        } catch (error) {
            console.error('Error creating customer notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const createStocktakeNotification = useCallback(async (action, stocktakeName, storeId, userId, newStatus = null) => {
        if (!user || !selectedStore) return;
        
        try {
            await notificationService.createStocktakeNotification(action, stocktakeName, storeId, userId, newStatus);
            await loadNotifications();
        } catch (error) {
            console.error('Error creating stocktake notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const createErrorNotification = useCallback(async (title, message) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
            title: title || 'Lỗi',
            message: message || 'Đã xảy ra lỗi',
                type: 'ERROR',
                category: 'GENERAL',

                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
            await loadNotifications();
        } catch (error) {
            console.error('Error creating error notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const createSuccessNotification = useCallback(async (title, message) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
            title: title || 'Thành công',
            message: message || 'Thao tác thành công',
                type: 'SUCCESS',
                category: 'GENERAL',

                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
            
            await loadNotifications();
        } catch (error) {
            console.error('Error creating success notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const createCategoryNotification = useCallback(async (action, categoryName) => {
        if (!user || !selectedStore) return;
        
        try {
            // Xác định type dựa trên action
            let notificationType = 'INFO';
            let actionText = action;
            
            if (action === 'delete') {
                notificationType = 'WARNING';
                actionText = 'xóa';
            } else if (action === 'create') {
                notificationType = 'SUCCESS';
                actionText = 'tạo';
            } else if (action === 'update') {
                notificationType = 'INFO';
                actionText = 'cập nhật';
            }
            
            // Gọi backend method để tạo notification
            await notificationService.createCategoryNotification(action, categoryName, selectedStore.id, user.id);
            
            // Refresh notifications sau khi tạo
            await loadNotifications();
        } catch (error) {
            console.error('Error creating category notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const createZoneNotification = useCallback(async (action, zoneName) => {
        if (!user || !selectedStore) return;
        
        try {
            // Xác định type dựa trên action
            let notificationType = 'INFO';
            let actionText = action;
            
            if (action === 'delete') {
                notificationType = 'WARNING';
                actionText = 'xóa';
            } else if (action === 'create') {
                notificationType = 'SUCCESS';
                actionText = 'tạo';
            } else if (action === 'update') {
                notificationType = 'INFO';
                actionText = 'cập nhật';
            }
            
            // Gọi backend method để tạo notification
            await notificationService.createZoneNotification(action, zoneName, selectedStore.id, user.id);
            
            // Refresh notifications sau khi tạo
            await loadNotifications();
        } catch (error) {
            console.error('Error creating zone notification:', error);
        }
    }, [user, selectedStore, loadNotifications]);

    const value = {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        refreshNotifications,
        // Các function tạo notification (gọi API backend)
        createImportTransactionNotification,
        createSaleTransactionNotification,
        createProductNotification,
        createCustomerNotification,
        createStocktakeNotification,
        createCategoryNotification,
        createZoneNotification,
        createErrorNotification,
        createSuccessNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
