import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";
import MenuItem from '@mui/material/MenuItem';

const ZoneFormDialog = ({ open, onClose, form, setForm, onSubmit, editMode, zoneNameError, zoneDescriptionError, user, stores }) => {
    const isOwner = user?.roles?.includes('OWNER');
    // const isStaff = user?.roles?.includes('STAFF'); // Không cần vì STAFF không chọn kho
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{editMode ? "Edit Zone" : "Add Zone"}</DialogTitle>
            <DialogContent className="flex flex-col gap-4 mt-2">
                <TextField
                    label="Zone Name"
                    value={form.zoneName}
                    onChange={(e) => setForm({ ...form, zoneName: e.target.value })}
                    required
                    error={Boolean(zoneNameError)}
                    helperText={zoneNameError}
                />
                <TextField
                    label="Zone Description"
                    value={form.zoneDescription}
                    onChange={(e) => setForm({ ...form, zoneDescription: e.target.value })}
                    error={Boolean(zoneDescriptionError)}
                    helperText={zoneDescriptionError}
                    multiline
                    rows={10}
                />
                {isOwner && (
                    <TextField
                        select
                        label="Store"
                        value={form.storeId || ""}
                        onChange={e => setForm({ ...form, storeId: e.target.value })}
                        required
                    >
                        <MenuItem value="">Select store</MenuItem>
                        {stores.map(store => (
                            <MenuItem key={store.id} value={store.id}>{store.storeName}</MenuItem>
                        ))}
                    </TextField>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={onSubmit}>
                    {editMode ? "Update" : "Create"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ZoneFormDialog;
