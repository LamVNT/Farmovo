import React from 'react';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import { useStoreForStocktake } from '../../hooks/useStoreForStocktake';
import StoreSelector from './StoreSelector';

/**
 * Demo component để test StoreSelectionContext
 * Có thể sử dụng trong development để kiểm tra functionality
 */
const StoreSelectionDemo = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.roles?.[0];
    const storeForStocktake = useStoreForStocktake(user, userRole);

    const handleClearStore = () => {
        storeForStocktake.selectStore(null);
    };

    const validation = storeForStocktake.validateStoreSelection();

    return (
        <Box sx={{ maxWidth: 800, margin: '20px auto', p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', color: '#1976d2' }}>
                Store Selection Demo
            </Typography>

            {/* Current Status */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Current Status
                </Typography>
                
                <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
                    <Typography><strong>User Role:</strong> {userRole || 'N/A'}</Typography>
                    <Typography><strong>Current Store ID:</strong> {storeForStocktake.currentStoreId || 'None'}</Typography>
                    <Typography><strong>Current Store Name:</strong> {storeForStocktake.getStoreDisplayName() || 'None'}</Typography>
                    <Typography><strong>Should Show Selector:</strong> {storeForStocktake.shouldShowStoreSelector() ? 'Yes' : 'No'}</Typography>
                    <Typography><strong>Needs Selection:</strong> {storeForStocktake.needsStoreSelection ? 'Yes' : 'No'}</Typography>
                    <Typography><strong>Is Store Selected:</strong> {storeForStocktake.isStoreSelected() ? 'Yes' : 'No'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography><strong>Validation:</strong></Typography>
                    <Chip 
                        label={validation.isValid ? 'Valid' : 'Invalid'} 
                        color={validation.isValid ? 'success' : 'error'}
                        variant="filled"
                    />
                    {!validation.isValid && (
                        <Typography color="error" variant="body2">
                            {validation.message}
                        </Typography>
                    )}
                </Box>
            </Paper>

            {/* Store Selector */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Store Selector
                </Typography>
                
                <StoreSelector
                    user={user}
                    userRole={userRole}
                    onStoreChange={(storeId, storeObj) => {
                        console.log('Demo - Store changed:', storeId, storeObj);
                    }}
                />
            </Paper>

            {/* Actions */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Actions
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                        variant="outlined" 
                        color="error"
                        onClick={handleClearStore}
                        disabled={!storeForStocktake.isStoreSelected()}
                    >
                        Clear Store
                    </Button>
                    
                    <Button 
                        variant="outlined"
                        onClick={() => {
                            console.log('API Store ID:', storeForStocktake.getStoreIdForAPI());
                            console.log('Display Name:', storeForStocktake.getStoreDisplayName());
                            console.log('Validation:', storeForStocktake.validateStoreSelection());
                        }}
                    >
                        Log Info
                    </Button>
                </Box>
            </Paper>

            {/* API Usage Example */}
            <Paper sx={{ p: 3, bgcolor: '#e3f2fd' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
                    API Usage Example
                </Typography>
                
                <Box component="pre" sx={{ 
                    bgcolor: '#fff', 
                    p: 2, 
                    borderRadius: 1, 
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                }}>
{`// Validate before API call
const validation = storeForStocktake.validateStoreSelection();
if (!validation.isValid) {
    alert(validation.message);
    return;
}

// Get store ID for API
const storeId = storeForStocktake.getStoreIdForAPI();

// Make API call
const response = await fetch('/api/stocktakes', {
    method: 'POST',
    body: JSON.stringify({
        storeId: storeId,
        // ... other data
    })
});`}
                </Box>
            </Paper>

            {/* LocalStorage Info */}
            <Paper sx={{ p: 3, bgcolor: '#fff3e0' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f57c00' }}>
                    LocalStorage Info
                </Typography>
                
                <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography><strong>owner_selected_store_id:</strong> {localStorage.getItem('owner_selected_store_id') || 'None'}</Typography>
                    <Typography><strong>owner_selected_store:</strong> {localStorage.getItem('owner_selected_store') || 'None'}</Typography>
                    <Typography><strong>staff_store_id:</strong> {localStorage.getItem('staff_store_id') || 'None'}</Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default StoreSelectionDemo;
