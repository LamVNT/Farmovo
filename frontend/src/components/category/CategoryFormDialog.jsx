import React from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button
} from "@mui/material";

const CategoryFormDialog = ({ open, onClose, form, setForm, onSubmit, editMode }) => (
    <Dialog open={open} onClose={onClose}>
        <DialogTitle>{editMode ? "Edit Category" : "Create Category"}</DialogTitle>
        <DialogContent>
            <TextField
                autoFocus
                margin="dense"
                label="Category Name"
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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

export default CategoryFormDialog;