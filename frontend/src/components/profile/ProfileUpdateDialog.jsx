import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    CircularProgress,
    IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { userService } from '../../services/userService';

const ProfileUpdateDialog = ({ open, onClose, onProfileUpdated }) => {
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [initialData, setInitialData] = useState(null);

    useEffect(() => {
        if (open) {
            fetchCurrentUser();
        }
    }, [open]);

    const fetchCurrentUser = async () => {
        try {
            const user = await userService.getCurrentUser();
            setInitialData(user);
            setForm({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || ''
            });
            setError(null);
        } catch (err) {
            setError('Không thể tải thông tin người dùng: ' + err.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Chỉ gửi những field có thay đổi
            const changedFields = {};
            Object.keys(form).forEach(key => {
                if (form[key] !== initialData[key]) {
                    changedFields[key] = form[key];
                }
            });

            if (Object.keys(changedFields).length === 0) {
                setError('Không có thay đổi nào để cập nhật');
                setLoading(false);
                return;
            }

            await userService.updateProfile(changedFields);
            setSuccess(true);
            
            // Cập nhật initialData
            setInitialData(prev => ({ ...prev, ...changedFields }));
            
            // Gọi callback nếu có
            if (onProfileUpdated) {
                onProfileUpdated();
            }

            // Đóng dialog sau 1.5 giây
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setForm({
            fullName: '',
            email: '',
            phone: ''
        });
        setError(null);
        setSuccess(false);
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Cập nhật thông tin cá nhân</Typography>
                    <IconButton onClick={handleClose} size="small">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Cập nhật profile thành công!
                    </Alert>
                )}

                <TextField
                    fullWidth
                    margin="dense"
                    label="Họ tên"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    margin="dense"
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    margin="dense"
                    label="Số điện thoại"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                />
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button 
                    onClick={handleClose}
                    disabled={loading}
                >
                    Hủy
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfileUpdateDialog; 