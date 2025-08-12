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
import { generateUsername } from '../../utils/usernameGenerator';

const API_URL = `${import.meta.env.VITE_API_URL}`;

function generateRandomPassword() {
    // Tạo password đáp ứng yêu cầu validation
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let password = '';
    
    // Đảm bảo có ít nhất 1 ký tự từ mỗi loại
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length)); // 1 chữ hoa
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length)); // 1 chữ thường
    password += digits.charAt(Math.floor(Math.random() * digits.length)); // 1 số
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length)); // 1 ký tự đặc biệt
    
    // Thêm các ký tự ngẫu nhiên để đạt độ dài 12
    const allChars = uppercase + lowercase + digits + specialChars;
    for (let i = 4; i < 12; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle password để không có pattern dễ đoán
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

const UserFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode, errors = {}, currentUserRole = null, formErrors = {} }) => {
    const [stores, setStores] = useState([]);
    const [roles, setRoles] = useState([]);
    const [storesLoading, setStoresLoading] = useState(true); // Thêm state loading cho stores
    const [allUsernames, setAllUsernames] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    
    // Kiểm tra xem user hiện tại có phải là admin không
    const isAdmin = currentUserRole && currentUserRole.includes('ROLE_ADMIN');

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/storeList`, {
                    withCredentials: true,
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                });
                setStores(response.data.map(store => ({ id: store.id, name: store.storeName })));
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
            console.log('Debug store matching:', {
                formStoreId: form.storeId,
                formStoreName: form.storeName,
                matchedStore,
                storesCount: stores.length
            });
            if (matchedStore && matchedStore.name !== form.storeName) {
                // Nếu tìm thấy và name không khớp, update form với tên từ stores
                setForm(prev => ({ ...prev, storeName: matchedStore.name }));
            } else if (!matchedStore && form.storeName) {
                // Nếu không tìm thấy store trong list nhưng có storeName, tạo fallback object
                console.warn(`Store ID ${form.storeId} not found in list. Using fallback name: ${form.storeName}`);
            }
        }
    }, [storesLoading, stores, form.storeId, form.storeName, setForm]);

    useEffect(() => {
        if (open && !editMode) {
            // Khi mở dialog thêm mới, tự động sinh password
            setForm(prev => ({ ...prev, password: generateRandomPassword() }));
        }
    }, [open, editMode, setForm]);

    // Debug effect to log form data
    useEffect(() => {
        if (editMode && form) {
            console.log('UserFormDialog - Form data:', form);
            console.log('UserFormDialog - createdAt:', form.createdAt);
            console.log('UserFormDialog - updatedAt:', form.updatedAt);
        }
    }, [editMode, form]);

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
            roles: value ? [value] : [], // Chỉ lưu 1 role trong array
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
                    error={!!errors.fullName || !!formErrors.fullName}
                    helperText={errors.fullName || formErrors.fullName}
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
                    error={!!errors.email}
                    helperText={errors.email}
                />
                <TextField
                    margin="dense"
                    label="Tên đăng nhập"
                    name="username"
                    fullWidth
                    value={form.username || ''}
                    onChange={handleChange}
                    required
                    error={!!errors.username || !!formErrors.username}
                    helperText={errors.username || formErrors.username}
                />
                {isAdmin && (
                    <TextField
                        margin="dense"
                        label="Mật khẩu"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        fullWidth
                        value={form.password || ''}
                        onChange={handleChange}
                        required={!editMode}
                        error={!!errors.password || !!formErrors.password}
                        helperText={editMode ? 'Để trống nếu không muốn thay đổi mật khẩu' : (errors.password || formErrors.password)}
                        placeholder={editMode ? 'Để trống nếu không muốn thay đổi' : ''}
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
                )}
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
                            error={!!errors.storeId || !!formErrors.storeId}
                            helperText={errors.storeId || formErrors.storeId}
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
                    options={roles}
                    getOptionLabel={(option) => option}
                    value={form.roles && form.roles.length > 0 ? form.roles[0] : null}
                    onChange={handleRolesChange}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            margin="dense"
                            label="Role *"
                            fullWidth
                            required
                            error={!!errors.roles || !!formErrors.roles}
                            helperText={errors.roles || formErrors.roles}
                        />
                    )}
                />
                {editMode && (
                    <>
                        <TextField
                            margin="dense"
                            label="Ngày tạo"
                            fullWidth
                            value={form.createdAt ? new Date(form.createdAt).toLocaleString('vi-VN') : 'N/A'}
                            disabled
                        />
                        <TextField
                            margin="dense"
                            label="Ngày cập nhật"
                            fullWidth
                            value={form.updatedAt ? new Date(form.updatedAt).toLocaleString('vi-VN') : 'N/A'}
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