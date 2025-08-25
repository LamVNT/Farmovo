import { useStoreSelection } from '../contexts/StoreSelectionContext';

/**
 * Hook để quản lý store selection cho các trang stocktake
 * Tự động xử lý logic cho Owner/Admin/Staff
 */
export const useStoreForStocktake = (user, userRole) => {
    const { selectedStore, selectedStoreId, selectStore, getStoreForUser } = useStoreSelection();
    
    const storeInfo = getStoreForUser(user, userRole);
    
    return {
        // Current store info
        currentStoreId: storeInfo.storeId,
        currentStore: storeInfo.store,
        needsStoreSelection: storeInfo.needsSelection,
        
        // Global selected store (for Owner/Admin)
        selectedStore,
        selectedStoreId,
        
        // Actions
        selectStore,
        
        // Helper functions
        isStoreSelected: () => !!storeInfo.storeId,
        shouldShowStoreSelector: () => {
            const normalizedRole = (userRole || "").toUpperCase();
            return ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(normalizedRole);
        },
        
        // Validation
        validateStoreSelection: () => {
            if (storeInfo.needsSelection && !storeInfo.storeId) {
                return {
                    isValid: false,
                    message: "Vui lòng chọn kho hàng để tiếp tục"
                };
            }
            return {
                isValid: true,
                message: ""
            };
        },
        
        // For API calls
        getStoreIdForAPI: () => {
            return storeInfo.storeId;
        },
        
        // For display
        getStoreDisplayName: () => {
            if (storeInfo.store) {
                return storeInfo.store.storeName || storeInfo.store.name || `Store ${storeInfo.storeId}`;
            }
            return `Store ${storeInfo.storeId}`;
        }
    };
};
