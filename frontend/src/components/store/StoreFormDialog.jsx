import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const StoreFormDialog = ({ open, onClose, form, setForm, onSubmit, editMode }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{editMode ? "Chỉnh sửa cửa hàng" : "Thêm cửa hàng mới"}</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Tên cửa hàng"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Địa chỉ"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                    <TextField
                        margin="dense"
                        label="Mô tả"
                        name="description"
                        value={form.description || ""}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={5}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Hủy</Button>
                    <Button type="submit" variant="contained">{editMode ? "Cập nhật" : "Thêm mới"}</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default StoreFormDialog; 