import React, { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { userService } from '../../services/userService';

const PasswordChangeForm = ({ onPasswordChanged }) => {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleTogglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        if (!form.currentPassword.trim()) {
            setError('Vui lòng nhập mật khẩu hiện tại');
            return false;
        }
        if (!form.newPassword.trim()) {
            setError('Vui lòng nhập mật khẩu mới');
            return false;
        }
        if (form.newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự');
            return false;
        }
        if (form.newPassword !== form.confirmPassword) {
            setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
            return false;
        }
        if (form.currentPassword === form.newPassword) {
            setError('Mật khẩu mới không được trùng với mật khẩu hiện tại');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await userService.changePassword(form);
            setSuccess(true);
            
            // Reset form
            setForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            
            // Gọi callback nếu có
            if (onPasswordChanged) {
                onPasswordChanged();
            }

            // Reset success message sau 5 giây
            setTimeout(() => setSuccess(false), 5000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setError(null);
        setSuccess(false);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Thay đổi mật khẩu
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Mật khẩu đã được thay đổi thành công!
                </Alert>
            )}

            <TextField
                fullWidth
                margin="dense"
                label="Mật khẩu hiện tại"
                name="currentPassword"
                type={showPasswords.currentPassword ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={handleChange}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => handleTogglePasswordVisibility('currentPassword')}
                                edge="end"
                            >
                                {showPasswords.currentPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 2 }}
            />

            <TextField
                fullWidth
                margin="dense"
                label="Mật khẩu mới"
                name="newPassword"
                type={showPasswords.newPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={handleChange}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => handleTogglePasswordVisibility('newPassword')}
                                edge="end"
                            >
                                {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 2 }}
            />

            <TextField
                fullWidth
                margin="dense"
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                type={showPasswords.confirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                                edge="end"
                            >
                                {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Đang thay đổi...' : 'Thay đổi mật khẩu'}
                </Button>
            </Box>
        </Box>
    );
};

export default PasswordChangeForm; 