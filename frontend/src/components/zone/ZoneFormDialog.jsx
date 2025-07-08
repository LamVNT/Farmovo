import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from "@mui/material";

const ZoneFormDialog = ({ open, onClose, form, setForm, onSubmit, editMode, zoneNameError }) => {
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
                    multiline
                    rows={4}
                />
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
