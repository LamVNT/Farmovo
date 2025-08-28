import api from './axiosClient';

const NOTIFICATION_API = '/notifications';

export const notificationService = {
    // Lấy tất cả notification của user
    getUserNotifications: async (page = 0, size = 20, storeId = null) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('size', size);
            if (storeId) {
                params.append('storeId', storeId);
            }
            
            const response = await api.get(`${NOTIFICATION_API}?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    },

    // Lấy số notification chưa đọc của user
    getUnreadCount: async (storeId = null) => {
        try {
            const params = storeId ? `?storeId=${storeId}` : '';
            const response = await api.get(`${NOTIFICATION_API}/unread-count${params}`);
            return response.data.unreadCount;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    },

    // Lấy tất cả notification của store (cho Staff xem)
    getStoreNotifications: async (page = 0, size = 20, storeId) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('size', size);
            params.append('storeId', storeId);
            
            const response = await api.get(`${NOTIFICATION_API}/store?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching store notifications:', error);
            throw error;
        }
    },

    // Lấy số notification chưa đọc của store (cho Staff xem)
    getStoreUnreadCount: async (storeId) => {
        try {
            const response = await api.get(`${NOTIFICATION_API}/store/unread-count?storeId=${storeId}`);
            return response.data.unreadCount;
        } catch (error) {
            console.error('Error fetching store unread count:', error);
            return 0;
        }
    },

    // Lấy tất cả notification của tất cả store (cho Admin xem)
    getAllStoreNotifications: async (page = 0, size = 20) => {
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('size', size);
            
            const response = await api.get(`${NOTIFICATION_API}/all-stores?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching all store notifications:', error);
            throw error;
        }
    },

    // Lấy số notification chưa đọc của tất cả store (cho Admin xem)
    getAllStoreUnreadCount: async () => {
        try {
            const response = await api.get(`${NOTIFICATION_API}/all-stores/unread-count`);
            return response.data.unreadCount;
        } catch (error) {
            console.error('Error fetching all store unread count:', error);
            return 0;
        }
    },

    // Đánh dấu notification đã đọc
    markAsRead: async (notificationId) => {
        try {
            const response = await api.put(`${NOTIFICATION_API}/${notificationId}/read`);
            return response.data;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    },

    // Đánh dấu tất cả notification đã đọc
    markAllAsRead: async (storeId = null) => {
        try {
            const params = storeId ? `?storeId=${storeId}` : '';
            const response = await api.put(`${NOTIFICATION_API}/mark-all-read${params}`);
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    // Đánh dấu tất cả notification của tất cả store đã đọc (cho Admin)
    markAllNotificationsAsRead: async () => {
        try {
            const response = await api.put(`${NOTIFICATION_API}/mark-all-notifications-read`);
            return response.data;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            throw error;
        }
    },

    // Xóa notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await api.delete(`${NOTIFICATION_API}/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    },

    // Xóa tất cả notification
    deleteAllNotifications: async (storeId = null) => {
        try {
            const params = storeId ? `?storeId=${storeId}` : '';
            const response = await api.delete(`${NOTIFICATION_API}/delete-all${params}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            throw error;
        }
    },

    // Tạo notification mới
    createNotification: async (notificationData) => {
        try {
            const response = await api.post(NOTIFICATION_API, notificationData);
            return response.data;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    },

    // Tạo notification cho tất cả user trong store
    createNotificationForStore: async (storeId, notificationData) => {
        try {
            const response = await api.post(`${NOTIFICATION_API}/store/${storeId}`, notificationData);
            return response.data;
        } catch (error) {
            console.error('Error creating notification for store:', error);
            throw error;
        }
    },

    // Tạo notification cho import transaction
    createImportTransactionNotification: async (action, transactionName, storeId, userId, newStatus = null) => {
        try {
            const response = await api.post(`${NOTIFICATION_API}/import-transaction`, {
                action,
                transactionName,
                storeId,
                userId,
                newStatus
            });
            return response.data;
        } catch (error) {
            console.error('Error creating import transaction notification:', error);
            throw error;
        }
    },

    // Tạo notification cho sale transaction
    createSaleTransactionNotification: async (action, transactionName, storeId, userId, newStatus = null) => {
        try {
            const response = await api.post(`${NOTIFICATION_API}/sale-transaction`, {
                action,
                transactionName,
                storeId,
                userId,
                newStatus
            });
            return response.data;
        } catch (error) {
            console.error('Error creating sale transaction notification:', error);
            throw error;
        }
    },

    // Tạo notification cho product
    createProductNotification: async (action, productName, storeId, userId) => {
        try {
            const response = await api.post(`${NOTIFICATION_API}/product`, {
                action,
                productName,
                storeId,
                userId
            });
            return response.data;
        } catch (error) {
            console.error('Error creating product notification:', error);
            throw error;
        }
    },

    // Tạo notification cho customer
    createCustomerNotification: async (action, customerName, storeId, userId) => {
        try {
            const response = await api.post(`${NOTIFICATION_API}/customer`, {
                action,
                customerName,
                storeId,
                userId
            });
            return response.data;
        } catch (error) {
            console.error('Error creating customer notification:', error);
            throw error;
        }
    },

    // Tạo notification cho stocktake
    createStocktakeNotification: async (action, stocktakeName, storeId, userId, newStatus = null) => {
        try {
            const response = await api.post(`${NOTIFICATION_API}/stocktake`, {
                action,
                stocktakeName,
                storeId,
                userId,
                newStatus
            });
            return response.data;
        } catch (error) {
            console.error('Error creating stocktake notification:', error);
            throw error;
        }
    },

    // Tạo notification cho category
    createCategoryNotification: async (action, categoryName, storeId, userId) => {
        try {
            const response = await api.post(`${NOTIFICATION_API}/category`, {
                action,
                categoryName,
                storeId,
                userId
            });
            return response.data;
        } catch (error) {
            console.error('Error creating category notification:', error);
            throw error;
        }
    },

    // Tạo notification cho zone
    createZoneNotification: async (action, zoneName, storeId, userId) => {
        try {
            const response = await api.post(`${NOTIFICATION_API}/zone`, {
                action,
                zoneName,
                storeId,
                userId
            });
            return response.data;
        } catch (error) {
            console.error('Error creating zone notification:', error);
            throw error;
        }
    }
};
