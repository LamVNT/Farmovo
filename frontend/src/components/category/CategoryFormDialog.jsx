import React from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Typography, styled
} from "@mui/material";

const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: 12,
        padding: theme.spacing(2),
        minWidth: 400,
    },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: theme.palette.grey[300],
        },
        '&:hover fieldset': {
            borderColor: theme.palette.primary.main,
        },
        '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
        },
    },
    marginBottom: theme.spacing(2),
}));

const CategoryFormDialog = ({ open, onClose, form, setForm, onSubmit, editMode }) => (
    <StyledDialog open={open} onClose={onClose}>
        <DialogTitle>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
                {editMode ? "Edit Category" : "Create Category"}
            </Typography>
        </DialogTitle>
        <DialogContent>
            <Box sx={{ padding: 2 }}>
                <StyledTextField
                    autoFocus
                    margin="dense"
                    label="Category Name"
                    fullWidth
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    variant="outlined"
                    required
                    error={!form.name.trim()}
                    helperText={!form.name.trim() ? "Name is required" : ""}
                />
                <StyledTextField
                    margin="dense"
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    variant="outlined"
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ padding: 2 }}>
            <Button onClick={onClose} variant="outlined" color="secondary">
                Cancel
            </Button>
            <Button
                onClick={onSubmit}
                variant="contained"
                color="primary"
                disabled={!form.name.trim()}
            >
                {editMode ? "Update" : "Create"}
            </Button>
        </DialogActions>
    </StyledDialog>
);

export default CategoryFormDialog;