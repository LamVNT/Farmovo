import React, {useEffect, useState} from 'react';
import {Autocomplete, Button, CircularProgress, IconButton, InputAdornment, TextField,} from '@mui/material';
import {Visibility, VisibilityOff} from '@mui/icons-material';
import {userService} from '../../services/userService';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/stores`;

const Profile = () => {
    const [form, setForm] = useState(null);
    const [stores, setStores] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

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

    const handleChange = (e) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
    };

    const handleTogglePassword = () => {
        setShowPassword((prev) => !prev);
    };

    if (loading || !form) return <p><CircularProgress/></p>;

    return (
        <div className="p-6 bg-white rounded shadow-md w-full max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Hồ sơ cá nhân</h2>

            {error && <p style={{color: 'red'}}>{error}</p>}
            {success && <p style={{color: 'green'}}>Cập nhật thành công!</p>}

            <TextField
                fullWidth
                margin="dense"
                label="Họ tên"
                name="fullName"
                value={form.fullName || ''}
                onChange={handleChange}
            />

            <TextField
                fullWidth
                margin="dense"
                label="Tên đăng nhập"
                value={form.username}
                disabled
            />

            <TextField
                fullWidth
                margin="dense"
                label="Mật khẩu"
                name="password"
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
            />

            <TextField
                fullWidth
                margin="dense"
                label="Trạng thái"
                value={form.status ? 'Active' : 'Deactivate'}
                disabled
            />

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
            />

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

            <div className="mt-4 text-right">
                <Button
                    variant="contained"
                    onClick={async () => {
                        try {
                            const data = {
                                fullName: form.fullName,
                            };
                            await userService.updateCurrentUser(data);
                            setSuccess(true);
                            setTimeout(() => setSuccess(false), 3000);
                        } catch (err) {
                            setError(err.message);
                        }
                    }}
                >
                    Cập nhật
                </Button>
            </div>
        </div>
    );
};

export default Profile;
