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
} from '@mui/material';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/stores`;

const UserFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    const [stores, setStores] = useState([]);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await axios.get(`${API_URL}/admin/storeList`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setStores(response.data.map(store => ({ id: store.id, name: store.name })));
            } catch (error) {
                console.error('Không thể lấy danh sách cửa hàng:', error);
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
            fetchStores();
            fetchRoles();
        }
    }, [open]);

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
                <Autocomplete
                    options={stores}
                    getOptionLabel={(option) => option.name || ''}
                    value={stores.find((store) => store.id === form.storeId) || null}
                    onChange={handleStoreChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            label="Cửa hàng *"
                            fullWidth
                            required
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
                        <TextField
                            margin="dense"
                            label="Tên cửa hàng"
                            fullWidth
                            value={form.storeName || 'N/A'}
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