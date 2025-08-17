import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Divider,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert
} from "@mui/material";
import {
    Close as CloseIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Store as StoreIcon,
    LocationOn as LocationIcon,
    Description as DescriptionIcon,
    Save as SaveIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';

const ZoneFormDialog = ({ open, onClose, form, setForm, onSubmit, editMode, zoneNameError, zoneDescriptionError, storeIdError, user, stores, loading = false, submitting = false }) => {
    // Kiểm tra cả trường hợp role là string và array
    const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.roles];
    const isAdminOrOwner = userRoles.includes('OWNER') || userRoles.includes('ADMIN') || userRoles.includes('ROLE_OWNER') || userRoles.includes('ROLE_ADMIN');
    
    console.log("ZoneFormDialog - User:", user);
    console.log("ZoneFormDialog - User roles:", user?.roles);
    console.log("ZoneFormDialog - User roles array:", userRoles);
    console.log("ZoneFormDialog - isAdminOrOwner:", isAdminOrOwner);
    console.log("ZoneFormDialog - Stores:", stores);
    console.log("ZoneFormDialog - Stores length:", stores?.length);
    console.log("ZoneFormDialog - Submitting:", submitting);

    const handleClose = () => {
        setForm({ zoneName: '', zoneDescription: '', storeId: null });
        onClose();
    };

    const handleSubmit = () => {
        onSubmit();
    };

    const isFormValid = () => {
        return form.zoneName && form.zoneName.trim() !== '' && 
               (!isAdminOrOwner || (isAdminOrOwner && form.storeId));
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    minHeight: '60vh'
                }
            }}
        >
            {/* Header */}
            <DialogTitle sx={{
                backgroundColor: editMode ? '#1976d2' : '#2e7d32',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                px: 3
            }}>
                <Box display="flex" alignItems="center" gap={1}>
                    {editMode ? <EditIcon /> : <AddIcon />}
                    <Typography variant="h6" fontWeight="600">
                        {editMode ? "Chỉnh sửa Khu vực" : "Thêm Khu vực mới"}
                    </Typography>
                </Box>
                <IconButton
                    onClick={handleClose}
                    sx={{
                        color: 'white',
                        '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {/* Content Container */}
                <Box sx={{ p: 4 }}>
                    {/* Zone Name Section */}
                    <Box sx={{ mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <LocationIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                Tên Khu vực
                            </Typography>
                            <Chip
                                label="Bắt buộc"
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            placeholder="Ví dụ: Khu A, Khu B, Khu C..."
                            value={form.zoneName}
                            onChange={(e) => setForm({ ...form, zoneName: e.target.value })}
                            error={Boolean(zoneNameError)}
                            helperText={zoneNameError || "Nhập tên khu vực - Ví dụ: Khu A, Khu B, Khu C, Khu D..."}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: '#1976d2',
                                    },
                                }
                            }}
                        />
                    </Box>

                    {/* Zone Description Section */}
                    <Box sx={{ mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <DescriptionIcon color="primary" />
                            <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                Mô tả Khu vực
                            </Typography>
                            <Chip
                                label="Tùy chọn"
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                            />
                        </Box>
                        <TextField
                            fullWidth
                            placeholder="Nhập mô tả chi tiết về khu vực này..."
                            value={form.zoneDescription}
                            onChange={(e) => setForm({ ...form, zoneDescription: e.target.value })}
                            error={Boolean(zoneDescriptionError)}
                            helperText={zoneDescriptionError || "Mô tả chi tiết về khu vực, mục đích sử dụng, vị trí, v.v."}
                            multiline
                            rows={4}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: '#1976d2',
                                    },
                                }
                            }}
                        />
                    </Box>

                    {/* Store Selection Section */}
                    {isAdminOrOwner && stores && stores.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                                <StoreIcon color="primary" />
                                <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                                    Cửa hàng
                                </Typography>
                                <Chip
                                    label="Bắt buộc"
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }}
                                />
                            </Box>
                            <FormControl fullWidth variant="outlined" error={Boolean(storeIdError)}>
                                <InputLabel>Chọn cửa hàng</InputLabel>
                                <Select
                                    value={form.storeId || ""}
                                    onChange={(e) => setForm({ ...form, storeId: e.target.value })}
                                    label="Chọn cửa hàng"
                                    sx={{
                                        borderRadius: 2,
                                        '&:hover .MuiOutlinedInput-notchedOutline': {
                                            borderColor: '#1976d2',
                                        },
                                    }}
                                >
                                    <MenuItem value="" disabled>
                                        <em>Chọn cửa hàng</em>
                                    </MenuItem>
                                    {stores.map(store => (
                                        <MenuItem key={store.id} value={store.id}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <StoreIcon fontSize="small" color="action" />
                                                <Typography>{store.storeName}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                                {storeIdError && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                        {storeIdError}
                                    </Typography>
                                )}
                            </FormControl>
                        </Box>
                    )}
                    
                    {/* Debug info - chỉ hiển thị trong development */}
                    {process.env.NODE_ENV === 'development' && (
                        <Box sx={{ mb: 2, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                                Debug: isAdminOrOwner={isAdminOrOwner.toString()}, stores={stores?.length || 0}
                            </Typography>
                        </Box>
                    )}

                    {/* Info Alert */}
                    <Alert 
                        severity="info" 
                        sx={{ 
                            borderRadius: 2,
                            '& .MuiAlert-message': {
                                fontSize: '0.875rem'
                            }
                        }}
                    >
                        <Typography variant="body2">
                            <strong>Lưu ý:</strong> Tên khu vực nên ngắn gọn, dễ nhớ và có ý nghĩa để dễ dàng quản lý và tìm kiếm.
                        </Typography>
                    </Alert>

                    {/* Preview Section */}
                    {form.zoneName && (
                        <Box sx={{ 
                            mt: 3, 
                            p: 2, 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: 2,
                            border: '1px solid #e9ecef'
                        }}>
                            <Typography variant="subtitle2" fontWeight="600" color="text.secondary" mb={1}>
                                Xem trước:
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Chip 
                                    label={form.zoneName} 
                                    color="primary" 
                                    variant="outlined"
                                    icon={<LocationIcon />}
                                />
                                {form.storeId && stores.find(s => s.id === form.storeId) && (
                                    <Chip 
                                        label={stores.find(s => s.id === form.storeId).storeName}
                                        color="secondary" 
                                        variant="outlined"
                                        icon={<StoreIcon />}
                                    />
                                )}
                            </Box>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <Divider />

            {/* Actions */}
            <DialogActions sx={{
                p: 3,
                backgroundColor: '#fafafa',
                justifyContent: 'space-between'
            }}>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        {editMode ? "Cập nhật thông tin khu vực" : "Tạo khu vực mới trong hệ thống"}
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <Button
                        onClick={handleClose}
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3
                        }}
                    >
                        Hủy
                    </Button>
                                        <Button 
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!isFormValid() || loading || submitting}
                        startIcon={editMode ? <EditIcon /> : <SaveIcon />}
                        sx={{ 
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                            backgroundColor: editMode ? '#1976d2' : '#2e7d32',
                            '&:hover': {
                                backgroundColor: editMode ? '#1565c0' : '#1b5e20'
                            },
                            '&:disabled': {
                                backgroundColor: '#e0e0e0',
                                color: '#9e9e9e'
                            }
                        }}
                    >
                        {submitting ? "Đang xử lý..." : (editMode ? "Cập nhật" : "Tạo mới")}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default ZoneFormDialog;
