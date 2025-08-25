import React, { useEffect, useState } from 'react';
import {
    TextField,
    InputAdornment,
    IconButton,
    Autocomplete,
    CircularProgress,
    Box,
    Typography,
    Paper,
    Button,
    Grid
} from '@mui/material';
import { Visibility, VisibilityOff, Edit, Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import ProfileUpdateDialog from '../../components/profile/ProfileUpdateDialog';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}`;

const Profile = () => {
    const [form, setForm] = useState(null);
    const [stores, setStores] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [profileDialogOpen, setProfileDialogOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [storeRes, roleRes] = await Promise.all([
                    axios.get(`${API_URL}/admin/storeList`, {
                        withCredentials: true,
                        headers: {Authorization: `Bearer ${localStorage.getItem('token')}`},
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/authorities/admin/roleList`, {
                        withCredentials: true,
                        headers: {Authorization: `Bearer ${localStorage.getItem('token')}`},
                    }),
                ]);
                setStores(storeRes.data.map(store => ({id: store.id, name: store.name})));
                setRoles(roleRes.data.map(role => role.role));
            } catch (e) {
                console.error('Lỗi khi lấy metadata:', e);
            }
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const user = await userService.getCurrentUser();
                setForm({
                    id: user.id,
                    fullName: user.fullName,
                    username: user.username,
                    password: user.password, // placeholder không thật
                    status: user.status,
                    storeId: user.storeId,
                    storeName: user.storeName,
                    roles: user.roles || [],
                });
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    const handleOpenProfileDialog = () => {
        setProfileDialogOpen(true);
    };

    const handleCloseProfileDialog = () => {
        setProfileDialogOpen(false);
    };

    const handleProfileUpdated = () => {
        // Refresh user data after profile update
        const fetchUser = async () => {
            try {
                const user = await userService.getCurrentUser();
                setForm({
                    id: user.id,
                    fullName: user.fullName,
                    username: user.username,
                    password: user.password,
                    status: user.status,
                    storeId: user.storeId,
                    storeName: user.storeName,
                    roles: user.roles || [],
                });
            } catch (err) {
                console.error('Error refreshing user data:', err);
            }
        };
        fetchUser();
    };

    const handleChangePassword = () => {
        navigate('/profile/change-password');
    };

    if (loading || !form) return <p><CircularProgress/></p>;

    return (
        <div className="p-6 bg-white rounded shadow-md w-full max-w-4xl mx-auto">
            <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
                Hồ sơ cá nhân
            </Typography>

            {error && <p style={{color: 'red'}}>{error}</p>}
            {success && <p style={{color: 'green'}}>Cập nhật thành công!</p>}

            {/* Action Buttons */}
            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item>
                        <Button
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={handleOpenProfileDialog}
                            size="large"
                        >
                            Cập nhật Profile
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="outlined"
                            startIcon={<Lock />}
                            onClick={handleChangePassword}
                            size="large"
                        >
                            Thay đổi mật khẩu
                        </Button>
                    </Grid>
                </Grid>
            </Box>

            {/* User Info Display Section */}
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                    Thông tin tài khoản
                </Typography>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Họ tên"
                            value={form.fullName || ''}
                            disabled
                            sx={{ mb: 2 }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Tên đăng nhập"
                            value={form.username}
                            disabled
                            sx={{ mb: 2 }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Mật khẩu"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            disabled
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleTogglePassword} edge="end">
                                            {showPassword ? <VisibilityOff/> : <Visibility/>}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ mb: 2 }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            margin="dense"
                            label="Trạng thái"
                            value={form.status ? 'Active' : 'Deactivate'}
                            disabled
                            sx={{ mb: 2 }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            options={stores}
                            getOptionLabel={(option) => option.name || ''}
                            value={stores.find((store) => store.id === form.storeId) || null}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    margin="dense"
                                    label={form.storeName || ''}
                                    fullWidth
                                    disabled
                                />
                            )}
                            readOnly
                            disableClearable
                            sx={{ mb: 2 }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            multiple
                            options={roles}
                            getOptionLabel={(option) => option}
                            value={form.roles || []}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    margin="dense"
                                    label="Roles"
                                    fullWidth
                                    disabled
                                />
                            )}
                            readOnly
                            disableClearable
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Profile Update Dialog */}
            <ProfileUpdateDialog
                open={profileDialogOpen}
                onClose={handleCloseProfileDialog}
                onProfileUpdated={handleProfileUpdated}
            />
        </div>
    );
};

export default Profile;
