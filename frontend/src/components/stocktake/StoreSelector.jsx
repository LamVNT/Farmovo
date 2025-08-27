import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    FormControl,
    Select,
    MenuItem,
    CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import StoreIcon from '@mui/icons-material/Store';
import { getAllStores } from '../../services/storeService';
import { useStoreSelection } from '../../contexts/StoreSelectionContext';

const StoreSelector = ({ 
    user, 
    userRole, 
    onStoreChange, 
    disabled = false,
    size = 'medium',
    variant = 'enhanced' // 'enhanced' | 'simple'
}) => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const { selectedStore, selectedStoreId, selectStore, getStoreForUser } = useStoreSelection();
    
    const normalizedRole = (userRole || "").toUpperCase();
    const isOwnerOrAdmin = ["OWNER", "ROLE_OWNER", "ADMIN", "ROLE_ADMIN"].includes(normalizedRole);
    
    // Get current store info
    const storeInfo = getStoreForUser(user, userRole);
    const currentStoreId = storeInfo.storeId;

    // Load stores for Owner/Admin
    useEffect(() => {
        if (isOwnerOrAdmin) {
            const loadStores = async () => {
                setLoading(true);
                try {
                    const storesData = await getAllStores();
                    setStores(storesData || []);
                } catch (error) {
                    console.error('Error loading stores:', error);
                    setStores([]);
                } finally {
                    setLoading(false);
                }
            };
            loadStores();
        }
    }, [isOwnerOrAdmin]);

    const handleStoreChange = (storeId) => {
        const selectedStoreObj = stores.find(s => s.id === storeId);

        console.log('StoreSelector - handleStoreChange:', {
            storeId,
            selectedStoreObj,
            isOwnerOrAdmin,
            beforeSelectStore: { selectedStore, selectedStoreId }
        });

        // Chỉ update context nếu thực sự có thay đổi
        if (isOwnerOrAdmin && selectedStoreObj && String(selectedStoreObj.id) !== selectedStoreId) {
            selectStore(selectedStoreObj);

            // Debug: Check if context was updated
            setTimeout(() => {
                console.log('StoreSelector - After selectStore (async check):', {
                    selectedStore,
                    selectedStoreId
                });
            }, 100);
        }

        if (onStoreChange) {
            onStoreChange(storeId, selectedStoreObj);
        }
    };

    // Don't render for Staff (they have fixed store)
    if (!isOwnerOrAdmin) {
        return null;
    }

    if (variant === 'simple') {
        return (
            <FormControl size={size} sx={{ minWidth: 150 }}>
                <Select
                    value={currentStoreId || ''}
                    onChange={(e) => handleStoreChange(e.target.value)}
                    displayEmpty
                    disabled={disabled || loading}
                    sx={{
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: currentStoreId ? '#28a745' : '#ced4da'
                        }
                    }}
                >
                    <MenuItem value="">
                        <em>Chọn kho</em>
                    </MenuItem>
                    {stores.map(store => (
                        <MenuItem key={store.id} value={store.id}>
                            {store.storeName || store.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }

    return (
        <Box sx={{ 
            mb: 3, 
            p: 3, 
            bgcolor: '#f8f9fa', 
            borderRadius: 2, 
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#495057' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StoreIcon sx={{ color: '#6c757d' }} />
                    Chọn kho hàng
                </Box>
            </Typography>
            
            <FormControl size={size} sx={{ minWidth: 300 }}>
                <Select
                    value={currentStoreId || ''}
                    onChange={(e) => handleStoreChange(e.target.value)}
                    displayEmpty
                    disabled={disabled || loading}
                    sx={{ 
                        bgcolor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: currentStoreId ? '#28a745' : '#ced4da'
                        }
                    }}
                >
                    <MenuItem value="">
                        <em>-- Chọn kho hàng --</em>
                    </MenuItem>
                    {stores.map(store => (
                        <MenuItem key={store.id} value={store.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ 
                                    width: 8, 
                                    height: 8, 
                                    borderRadius: '50%', 
                                    bgcolor: '#28a745' 
                                }} />
                                {store.storeName || store.name}
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            
            {loading && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="body2" sx={{ color: '#6c757d' }}>
                        Đang tải danh sách kho...
                    </Typography>
                </Box>
            )}
            
            {!loading && currentStoreId && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: '#28a745', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#28a745', fontWeight: 500 }}>
                        Đã chọn kho: {stores.find(s => s.id === currentStoreId)?.storeName || stores.find(s => s.id === currentStoreId)?.name}
                    </Typography>
                </Box>
            )}
            
            {!loading && !currentStoreId && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon sx={{ color: '#ffc107', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: '#856404', fontStyle: 'italic' }}>
                        Vui lòng chọn kho hàng để tiếp tục
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default StoreSelector;
