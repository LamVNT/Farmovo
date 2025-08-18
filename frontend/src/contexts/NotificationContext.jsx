import React, { createContext, useContext, useState, useCallback } from 'react';

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

    // Thêm notification mới
    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date(),
            read: false,
            ...notification
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Tự động xóa notification sau 10 giây
        setTimeout(() => {
            removeNotification(newNotification.id);
        }, 10000);
    }, []);

    // Xóa notification
    const removeNotification = useCallback((id) => {
        setNotifications(prev => {
            const notification = prev.find(n => n.id === id);
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            return prev.filter(n => n.id !== id);
        });
    }, []);

    // Đánh dấu notification đã đọc
    const markAsRead = useCallback((id) => {
        setNotifications(prev => 
            prev.map(n => 
                n.id === id ? { ...n, read: true } : n
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    // Đánh dấu tất cả đã đọc
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
    }, []);

    // Xóa tất cả notifications
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    // Tạo notification cho các thao tác phổ biến
    const createImportTransactionNotification = useCallback((action, transactionName) => {
        const messages = {
            create: `Đã tạo phiếu nhập hàng: ${transactionName}`,
            update: `Đã cập nhật phiếu nhập hàng: ${transactionName}`,
            status_change: `Đã thay đổi trạng thái phiếu nhập hàng: ${transactionName}`,
            complete: `Đã hoàn thành phiếu nhập hàng: ${transactionName}`,
            cancel: `Đã hủy phiếu nhập hàng: ${transactionName}`,
            delete: `Đã xóa phiếu nhập hàng: ${transactionName}`
        };

        addNotification({
            type: 'success',
            title: 'Phiếu nhập hàng',
            message: messages[action] || messages.create,
            icon: '📦',
            category: 'import_transaction'
        });
    }, [addNotification]);

    const createSaleTransactionNotification = useCallback((action, transactionName) => {
        const messages = {
            create: `Đã tạo phiếu bán hàng: ${transactionName}`,
            update: `Đã cập nhật phiếu bán hàng: ${transactionName}`,
            status_change: `Đã thay đổi trạng thái phiếu bán hàng: ${transactionName}`,
            complete: `Đã hoàn thành phiếu bán hàng: ${transactionName}`,
            cancel: `Đã hủy phiếu bán hàng: ${transactionName}`,
            delete: `Đã xóa phiếu bán hàng: ${transactionName}`
        };

        addNotification({
            type: 'success',
            title: 'Phiếu bán hàng',
            message: messages[action] || messages.create,
            icon: '💰',
            category: 'sale_transaction'
        });
    }, [addNotification]);

    const createProductNotification = useCallback((action, productName) => {
        const messages = {
            create: `Đã tạo sản phẩm: ${productName}`,
            update: `Đã cập nhật sản phẩm: ${productName}`,
            delete: `Đã xóa sản phẩm: ${productName}`
        };

        addNotification({
            type: 'info',
            title: 'Sản phẩm',
            message: messages[action] || messages.create,
            icon: '🏷️',
            category: 'product'
        });
    }, [addNotification]);

    const createCustomerNotification = useCallback((action, customerName) => {
        const messages = {
            create: `Đã tạo khách hàng: ${customerName}`,
            update: `Đã cập nhật khách hàng: ${customerName}`,
            delete: `Đã xóa khách hàng: ${customerName}`
        };

        addNotification({
            type: 'info',
            title: 'Khách hàng',
            message: messages[action] || messages.create,
            icon: '👤',
            category: 'customer'
        });
    }, [addNotification]);

    const createStocktakeNotification = useCallback((action, stocktakeName) => {
        const messages = {
            create: `Đã tạo kiểm kê: ${stocktakeName}`,
            update: `Đã cập nhật kiểm kê: ${stocktakeName}`,
            complete: `Đã hoàn thành kiểm kê: ${stocktakeName}`,
            cancel: `Đã hủy kiểm kê: ${stocktakeName}`
        };

        addNotification({
            type: 'warning',
            title: 'Kiểm kê',
            message: messages[action] || messages.create,
            icon: '📊',
            category: 'stocktake'
        });
    }, [addNotification]);

    const createErrorNotification = useCallback((title, message) => {
        addNotification({
            type: 'error',
            title: title || 'Lỗi',
            message: message || 'Đã xảy ra lỗi',
            icon: '❌',
            category: 'error'
        });
    }, [addNotification]);

    const createSuccessNotification = useCallback((title, message) => {
        addNotification({
            type: 'success',
            title: title || 'Thành công',
            message: message || 'Thao tác thành công',
            icon: '✅',
            category: 'success'
        });
    }, [addNotification]);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        createImportTransactionNotification,
        createSaleTransactionNotification,
        createProductNotification,
        createCustomerNotification,
        createStocktakeNotification,
        createErrorNotification,
        createSuccessNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
