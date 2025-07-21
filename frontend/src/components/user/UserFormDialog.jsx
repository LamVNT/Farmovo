import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
    Autocomplete,
    CircularProgress, // Thêm để hiển thị loading
    InputAdornment,
    IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}`;

function removeVietnameseTones(str) {
    return str
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function generateUsername(fullName, existingUsernames) {
    if (!fullName) return '';
    const parts = removeVietnameseTones(fullName.trim()).split(/\s+/);
    if (parts.length === 0) return '';
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, -1).map(p => p[0]?.toUpperCase() || '').join('');
    let base = lastName + (initials ? initials : '');
    base = base.replace(/[^a-zA-Z0-9]/g, '');
    let number = 1;
    let username = base + number;
    while (existingUsernames.includes(username)) {
        number++;
        username = base + number;
    }
    return username;
}

function generateRandomPassword(length = 5) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const UserFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    const [stores, setStores] = useState([]);
    const [roles, setRoles] = useState([]);
    const [storesLoading, setStoresLoading] = useState(true); // Thêm state loading cho stores
    const [allUsernames, setAllUsernames] = useState([]);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/storeList`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setStores(response.data.map(store => ({ id: store.id, name: store.name })));
            } catch (error) {
                console.error('Không thể lấy danh sách cửa hàng:', error);
            } finally {
                setStoresLoading(false); // Kết thúc loading dù thành công hay thất bại
            }
        };

        const fetchRoles = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/authorities/admin/roleList`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setRoles(response.data.map(role => role.role));
            } catch (error) {
                console.error('Không thể lấy danh sách role:', error);
            }
        };

        const fetchUsernames = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/userList`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setAllUsernames(response.data.map(u => u.username));
            } catch (error) {
                setAllUsernames([]);
            }
        };

        if (open) {
            setStoresLoading(true); // Reset loading khi mở dialog
            fetchStores();
            fetchRoles();
            if (!editMode) fetchUsernames();
        }
    }, [open, editMode]);

    // Thêm useEffect để sync value sau khi stores load
    useEffect(() => {
        if (!storesLoading && form.storeId && stores.length > 0) {
            const matchedStore = stores.find(store => store.id === form.storeId);
            if (matchedStore && matchedStore.name !== form.storeName) {
                // Nếu tìm thấy và name không khớp (hiếm), update form
                setForm(prev => ({ ...prev, storeName: matchedStore.name }));
            } else if (!matchedStore) {
                console.warn(`Store ID ${form.storeId} not found in list. Using fallback name: ${form.storeName}`);
            }
        }
    }, [storesLoading, stores, form.storeId, form.storeName, setForm]);

    useEffect(() => {
        if (open && !editMode) {
            // Khi mở dialog thêm mới, tự động sinh password
            setForm(prev => ({ ...prev, password: generateRandomPassword(5) }));
        }
    }, [open, editMode, setForm]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            let updated = { ...prev, [name]: value };
            if (name === 'fullName' && !editMode) {
                // Tự động tạo username khi nhập fullName
                const username = generateUsername(value, allUsernames);
                updated.username = username;
            }
            return updated;
        });
    };

    const handleStatusChange = (e) => {
        setForm((prev) => ({ ...prev, status: e.target.checked }));
    };

    const handleStoreChange = (event, value) => {
        setForm((prev) => ({
            ...prev,
            storeId: value ? value.id : null,
            storeName: value ? value.name : '',
        }));
    };

    const handleRolesChange = (event, value) => {
        setForm((prev) => ({
            ...prev,
            roles: value || [],
        }));
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{editMode ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</DialogTitle>
            <DialogContent style={{ maxHeight: '70vh', overflowY: 'auto', paddingTop: 8, paddingBottom: 8 }}>
                {editMode && (
                    <TextField
                        margin="dense"
                        label="ID"
                        fullWidth
                        value={form.id || 'N/A'}
                        disabled
                    />
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    label="Họ tên"
                    name="fullName"
                    fullWidth
                    value={form.fullName || ''}
                    onChange={handleChange}
                    required
                />
                <TextField
                    margin="dense"
                    label="Email"
                    name="email"
                    type="email"
                    fullWidth
                    value={form.email || ''}
                    onChange={handleChange}
                    required={false}
                />
                <TextField
                    margin="dense"
                    label="Tên đăng nhập"
                    name="username"
                    fullWidth
                    value={form.username || ''}
                    onChange={handleChange}
                    required
                />
                <TextField
                    margin="dense"
                    label="Mật khẩu"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    value={editMode ? (form.password || '******') : (form.password || '')}
                    onChange={handleChange}
                    required={!editMode}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={handleClickShowPassword}
                                    onMouseDown={handleMouseDownPassword}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={form.status || false}
                            onChange={handleStatusChange}
                            name="status"
                        />
                    }
                    label="Hoạt động"
                />
                {/* Autocomplete cho cửa hàng với loading */}
                <Autocomplete
                    options={stores}
                    getOptionLabel={(option) => option.name || ''}
                    value={
                        storesLoading
                            ? null
                            : stores.find((store) => String(store.id) === String(form.storeId)) ||
                              (form.storeId && form.storeName ? { id: form.storeId, name: form.storeName } : null)
                    }
                    onChange={handleStoreChange}
                    loading={storesLoading}
                    isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            label="Cửa hàng *"
                            fullWidth
                            required
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {storesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
                <Autocomplete
                    multiple
                    options={roles}
                    getOptionLabel={(option) => option}
                    value={form.roles || []}
                    onChange={handleRolesChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            label="Roles *"
                            fullWidth
                            required
                        />
                    )}
                />
                {editMode && (
                    <>
                        <TextField
                            margin="dense"
                            label="Ngày tạo"
                            fullWidth
                            value={form.createAt ? new Date(form.createAt).toLocaleString('vi-VN') : 'N/A'}
                            disabled
                        />
                        <TextField
                            margin="dense"
                            label="Ngày cập nhật"
                            fullWidth
                            value={form.updateAt ? new Date(form.updateAt).toLocaleString('vi-VN') : 'N/A'}
                            disabled
                        />
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button onClick={onSubmit} variant="contained">
                    {editMode ? 'Cập nhật' : 'Thêm'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserFormDialog;