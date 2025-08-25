import { createContext, useContext, useState, useEffect } from 'react';

const StoreSelectionContext = createContext();

export const useStoreSelection = () => {
    const context = useContext(StoreSelectionContext);
    if (!context) {
        throw new Error('useStoreSelection must be used within a StoreSelectionProvider');
    }
    return context;
};

export const StoreSelectionProvider = ({ children }) => {
    const [selectedStore, setSelectedStore] = useState(null);
    const [selectedStoreId, setSelectedStoreId] = useState(null);

    // Load from localStorage on mount
    useEffect(() => {
        const savedStoreId = localStorage.getItem('owner_selected_store_id');
        const savedStore = localStorage.getItem('owner_selected_store');

        console.log('StoreSelectionContext - Loading from localStorage:', {
            savedStoreId,
            savedStore
        });

        if (savedStoreId) {
            setSelectedStoreId(String(savedStoreId)); // Ensure string type
        }

        if (savedStore) {
            try {
                setSelectedStore(JSON.parse(savedStore));
            } catch (e) {
                console.error('Error parsing saved store:', e);
            }
        }
    }, []);

    // Save to localStorage when changed
    useEffect(() => {
        console.log('StoreSelectionContext - selectedStoreId changed:', selectedStoreId);

        if (selectedStoreId) {
            localStorage.setItem('owner_selected_store_id', selectedStoreId);
        } else {
            localStorage.removeItem('owner_selected_store_id');
        }
    }, [selectedStoreId]);

    useEffect(() => {
        if (selectedStore) {
            localStorage.setItem('owner_selected_store', JSON.stringify(selectedStore));
        } else {
            localStorage.removeItem('owner_selected_store');
        }
    }, [selectedStore]);

    const selectStore = (store) => {
        console.log('StoreSelectionContext - selectStore called:', {
            store,
            storeId: store?.id,
            storeIdType: typeof store?.id,
            currentSelectedStoreId: selectedStoreId
        });

        const newStoreId = store?.id ? String(store.id) : null; // Ensure string type

        // Chỉ update nếu thực sự có thay đổi để tránh vòng lặp vô hạn
        if (newStoreId !== selectedStoreId) {
            setSelectedStore(store);
            setSelectedStoreId(newStoreId);

            console.log('StoreSelectionContext - selectStore setting:', {
                newStoreId,
                newStoreIdType: typeof newStoreId
            });
        } else {
            console.log('StoreSelectionContext - selectStore skipped (same store):', {
                newStoreId,
                currentSelectedStoreId: selectedStoreId
            });
        }
    };

    const clearStore = () => {
        setSelectedStore(null);
        setSelectedStoreId(null);
    };

    const getStoreForUser = (user, userRole) => {
        const normalizedRole = (userRole || "").toUpperCase();
        const isOwnerOrAdmin = ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(normalizedRole);
        const isStaff = normalizedRole === "STAFF" || normalizedRole === "ROLE_STAFF";

        if (isOwnerOrAdmin) {
            // Owner/Admin: use selected store
            return {
                storeId: selectedStoreId,
                store: selectedStore,
                needsSelection: !selectedStoreId
            };
        } else if (isStaff) {
            // Staff: use their assigned store
            let staffStoreId = null;
            if (user && user.store && typeof user.store === 'object' && user.store.id != null) {
                staffStoreId = user.store.id;
            } else if (typeof user?.storeId === 'number') {
                staffStoreId = user.storeId;
            } else if (localStorage.getItem('staff_store_id')) {
                staffStoreId = Number(localStorage.getItem('staff_store_id'));
            }

            return {
                storeId: staffStoreId,
                store: user?.store || null,
                needsSelection: false
            };
        }

        return {
            storeId: null,
            store: null,
            needsSelection: true
        };
    };

    const value = {
        selectedStore,
        selectedStoreId,
        selectStore,
        clearStore,
        getStoreForUser
    };

    return (
        <StoreSelectionContext.Provider value={value}>
            {children}
        </StoreSelectionContext.Provider>
    );
};
