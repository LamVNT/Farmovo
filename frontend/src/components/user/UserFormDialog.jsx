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
} from '@mui/material';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}`;

const UserFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    const [stores, setStores] = useState([]);
    const [roles, setRoles] = useState([]);
    const [storesLoading, setStoresLoading] = useState(true); // Thêm state loading cho stores

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

        if (open) {
            setStoresLoading(true); // Reset loading khi mở dialog
            fetchStores();
            fetchRoles();
        }
    }, [open]);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
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

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{editMode ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}</DialogTitle>
            <DialogContent>
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
                    type="password"
                    fullWidth
                    value={form.password || ''}
                    onChange={handleChange}
                    required={!editMode}
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