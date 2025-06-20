import React from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button
} from "@mui/material";

const UserFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{editMode ? "Edit User" : "Create User"}</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Name"
                    fullWidth
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <TextField
                    margin="dense"
                    label="Email"
                    fullWidth
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <TextField
                    margin="dense"
                    label="Role"
                    fullWidth
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onSubmit} variant="contained">
                    {editMode ? "Update" : "Create"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserFormDialog;
