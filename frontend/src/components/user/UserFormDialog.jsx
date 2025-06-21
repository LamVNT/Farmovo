import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    FormControlLabel,
    Checkbox,
} from '@mui/material';

const UserFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleStatusChange = (e) => {
        setForm((prev) => ({ ...prev, status: e.target.checked }));
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
                    value={form.fullName}
                    onChange={handleChange}
                    required
                />
                <TextField
                    margin="dense"
                    label="Tên đăng nhập"
                    name="username"
                    fullWidth
                    value={form.username}
                    onChange={handleChange}
                    required
                />
                <TextField
                    margin="dense"
                    label="Mật khẩu"
                    name="password"
                    type="password"
                    fullWidth
                    value={form.password}
                    onChange={handleChange}
                    required={!editMode}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={form.status}
                            onChange={handleStatusChange}
                            name="status"
                        />
                    }
                    label="Hoạt động"
                />
                <TextField
                    margin="dense"
                    label="ID Cửa hàng"
                    name="storeId"
                    type="number"
                    fullWidth
                    value={form.storeId}
                    onChange={handleChange}
                    required
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