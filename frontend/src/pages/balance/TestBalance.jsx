import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useStoreForStocktake } from '../../hooks/useStoreForStocktake';
import StoreSelector from '../../components/stocktake/StoreSelector';

const TestBalancePage = () => {
    const { id } = useParams();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));
    const userRole = user?.roles?.[0];
    
    // Store selection for stocktake
    const storeForStocktake = useStoreForStocktake(user, userRole);
    
    // Get data from navigation state
    const { stocktakeId, stocktakeCode, storeId, storeName } = location.state || {};
    
    return (
        <Box sx={{ maxWidth: '98%', margin: "0px auto 10px auto", background: "#fff", p: 4, borderRadius: 3, boxShadow: 2 }}>
            <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#1976d2' }}>
                Test Balance Page - Cân bằng kho
            </Typography>
            
            {/* Debug Info */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Debug Information:
                </Typography>
                
                <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography><strong>Stocktake ID:</strong> {stocktakeId || 'N/A'}</Typography>
                    <Typography><strong>Stocktake Code:</strong> {stocktakeCode || 'N/A'}</Typography>
                    <Typography><strong>Store ID from state:</strong> {storeId || 'N/A'}</Typography>
                    <Typography><strong>Store Name from state:</strong> {storeName || 'N/A'}</Typography>
                    <Typography><strong>Current Store ID (Context):</strong> {storeForStocktake.currentStoreId || 'N/A'}</Typography>
                    <Typography><strong>Current Store Name (Context):</strong> {storeForStocktake.getStoreDisplayName() || 'N/A'}</Typography>
                    <Typography><strong>User Role:</strong> {userRole || 'N/A'}</Typography>
                    <Typography><strong>Needs Store Selection:</strong> {storeForStocktake.needsStoreSelection ? 'Yes' : 'No'}</Typography>
                    <Typography><strong>Is Store Selected:</strong> {storeForStocktake.isStoreSelected() ? 'Yes' : 'No'}</Typography>
                </Box>
            </Paper>
            
            {/* Store Selector */}
            <StoreSelector
                user={user}
                userRole={userRole}
                onStoreChange={(storeId, storeObj) => {
                    console.log('Balance page - Store changed to:', storeId, storeObj);
                }}
            />
            
            {/* Validation Status */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Validation Status:
                </Typography>
                
                {(() => {
                    const validation = storeForStocktake.validateStoreSelection();
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip 
                                label={validation.isValid ? 'Valid' : 'Invalid'} 
                                color={validation.isValid ? 'success' : 'error'}
                                variant="filled"
                            />
                            {!validation.isValid && (
                                <Typography color="error">{validation.message}</Typography>
                            )}
                        </Box>
                    );
                })()}
            </Paper>
            
            {/* Store Info Display */}
            {storeForStocktake.isStoreSelected() && (
                <Paper sx={{ p: 3, bgcolor: '#e8f5e8' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2e7d32' }}>
                        ✅ Store Selected Successfully!
                    </Typography>
                    
                    <Box sx={{ display: 'grid', gap: 1 }}>
                        <Typography><strong>Store ID:</strong> {storeForStocktake.currentStoreId}</Typography>
                        <Typography><strong>Store Name:</strong> {storeForStocktake.getStoreDisplayName()}</Typography>
                        <Typography><strong>API Store ID:</strong> {storeForStocktake.getStoreIdForAPI()}</Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#666' }}>
                        Trang này sẽ sử dụng store đã chọn để tạo phiếu cân bằng kho.
                    </Typography>
                </Paper>
            )}
            
            {/* Navigation Info */}
            <Paper sx={{ p: 3, mt: 3, bgcolor: '#fff3e0' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#f57c00' }}>
                    Navigation Flow Test:
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Luồng test sự đồng nhất:
                </Typography>
                
                <Box component="ol" sx={{ pl: 2 }}>
                    <li>Owner chọn kho trong trang Create Stocktake</li>
                    <li>Tạo stocktake thành công → chuyển sang Detail</li>
                    <li>Trong Detail, click "Cân bằng kho" → chuyển sang Balance</li>
                    <li>Balance page tự động nhận store đã chọn từ context</li>
                    <li>Không cần chọn lại store</li>
                </Box>
            </Paper>
        </Box>
    );
};

export default TestBalancePage;
