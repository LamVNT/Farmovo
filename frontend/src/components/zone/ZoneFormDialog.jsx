import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const ZoneFormDialog = ({ open, onClose, form, setForm, onSubmit, editMode, zoneNameError,zoneDescriptionError }) => {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{editMode ? "Sửa khu vực" : "Thêm khu vực"}</DialogTitle>
            <DialogContent className="flex flex-col gap-4 mt-2">
                <TextField
                    label="Tên khu vực"
                    value={form.zoneName}
                    onChange={(e) => setForm({ ...form, zoneName: e.target.value })}
                    required
                    error={Boolean(zoneNameError)}
                    helperText={zoneNameError}
                />
                <TextField
                    label="Mô tả khu vực"
                    value={form.zoneDescription}
                    onChange={(e) => setForm({ ...form, zoneDescription: e.target.value })}
                    error={Boolean(zoneDescriptionError)}
                    helperText={zoneDescriptionError}
                    multiline
                    rows={10}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button variant="contained" onClick={onSubmit}>
                    {editMode ? "Cập nhật" : "Tạo mới"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoneFormDialog;
