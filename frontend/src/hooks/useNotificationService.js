import { useCallback } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthorizationContext';
import { useStoreSelection } from '../contexts/StoreSelectionContext';

export const useNotificationService = () => {
    const { user } = useAuth();
    const { selectedStore } = useStoreSelection();

    // Tạo notification cho import transaction
    const createImportTransactionNotification = useCallback(async (action, transactionName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Phiếu nhập hàng',
                message: `Đã ${action} phiếu nhập hàng: ${transactionName}`,
                type: 'SUCCESS',
                category: 'IMPORT_TRANSACTION',
                icon: '📦',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating import transaction notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho sale transaction
    const createSaleTransactionNotification = useCallback(async (action, transactionName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Phiếu bán hàng',
                message: `Đã ${action} phiếu bán hàng: ${transactionName}`,
                type: 'SUCCESS',
                category: 'SALE_TRANSACTION',
                icon: '💰',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating sale transaction notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho product
    const createProductNotification = useCallback(async (action, productName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Sản phẩm',
                message: `Đã ${action} sản phẩm: ${productName}`,
                type: 'INFO',
                category: 'PRODUCT',
                icon: '🏷️',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating product notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho customer
    const createCustomerNotification = useCallback(async (action, customerName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Khách hàng',
                message: `Đã ${action} khách hàng: ${customerName}`,
                type: 'INFO',
                category: 'CUSTOMER',
                icon: '👤',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating customer notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho stocktake
    const createStocktakeNotification = useCallback(async (action, stocktakeName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Kiểm kê',
                message: `Đã ${action} kiểm kê: ${stocktakeName}`,
                type: 'WARNING',
                category: 'STOCKTAKE',
                icon: '📊',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating stocktake notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho user
    const createUserNotification = useCallback(async (action, userName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Người dùng',
                message: `Đã ${action} người dùng: ${userName}`,
                type: 'INFO',
                category: 'USER',
                icon: '👤',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating user notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho store
    const createStoreNotification = useCallback(async (action, storeName) => {
        if (!user) return;
        
        try {
            const notificationData = {
                title: 'Cửa hàng',
                message: `Đã ${action} cửa hàng: ${storeName}`,
                type: 'INFO',
                category: 'STORE',
                icon: '🏪',
                storeId: null // Không có storeId vì đây là thao tác với store
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating store notification:', error);
        }
    }, [user]);

    // Tạo notification cho category
    const createCategoryNotification = useCallback(async (action, categoryName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Danh mục',
                message: `Đã ${action} danh mục: ${categoryName}`,
                type: 'INFO',
                category: 'CATEGORY',
                icon: '📁',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating category notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho zone
    const createZoneNotification = useCallback(async (action, zoneName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Khu vực',
                message: `Đã ${action} khu vực: ${zoneName}`,
                type: 'INFO',
                category: 'ZONE',
                icon: '🗺️',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating zone notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho debt note
    const createDebtNoteNotification = useCallback(async (action, debtNoteName) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title: 'Ghi chú nợ',
                message: `Đã ${action} ghi chú nợ: ${debtNoteName}`,
                type: 'WARNING',
                category: 'DEBT_NOTE',
                icon: '📝',
                storeId: selectedStore.id
            };
            
            await notificationService.createNotification(notificationData);
        } catch (error) {
            console.error('Error creating debt note notification:', error);
        }
    }, [user, selectedStore]);

    // Tạo notification cho tất cả user trong store
    const createNotificationForAllUsersInStore = useCallback(async (title, message, type, category, icon) => {
        if (!user || !selectedStore) return;
        
        try {
            const notificationData = {
                title,
                message,
                type,
                category,
                icon,
                storeId: selectedStore.id
            };
            
            await notificationService.createNotificationForStore(selectedStore.id, notificationData);
        } catch (error) {
            console.error('Error creating notification for all users in store:', error);
        }
    }, [user, selectedStore]);

    return {
        createImportTransactionNotification,
        createSaleTransactionNotification,
        createProductNotification,
        createCustomerNotification,
        createStocktakeNotification,
        createUserNotification,
        createStoreNotification,
        createCategoryNotification,
        createZoneNotification,
        createDebtNoteNotification,
        createNotificationForAllUsersInStore
    };
};
