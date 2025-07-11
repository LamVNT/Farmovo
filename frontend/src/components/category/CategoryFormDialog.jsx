import React from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Box, Typography, styled, FormHelperText
} from "@mui/material";

const StyledDialog = styled(Dialog)(({theme}) => ({
    '& .MuiDialog-paper': {
        borderRadius: 12,
        padding: theme.spacing(2),
        minWidth: 400,
    },
}));

const StyledTextField = styled(TextField)(({theme}) => ({
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

const CategoryFormDialog = ({open, onClose, form, setForm, onSubmit, editMode}) => {
    const validateName = () => {
        if (!form.name.trim()) return "Name is required";
        if (form.name.length > 255) return "Name must not exceed 255 characters";
        return null;
    };

    const validateDescription = () => {
        if (form.description && form.description.length > 1000) {
            return "Description must not exceed 1000 characters";
        }
        return null;
    };

    const nameError = validateName();
    const descriptionError = validateDescription();
    const isFormValid = !nameError && !descriptionError;

    return (
        <StyledDialog open={open} onClose={onClose}>
            <DialogTitle>
                {/* Sửa lỗi: Không lồng <h6> trong <h2> */}
                <span style={{fontWeight: 'bold', color: 'inherit', fontSize: 20}}>
                    {editMode ? "Edit Category" : "Create Category"}
                </span>
            </DialogTitle>
            <DialogContent>
                <Box sx={{padding: 2}}>
                    <StyledTextField
                        autoFocus
                        margin="dense"
                        label="Category Name"
                        fullWidth
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        variant="outlined"
                        required
                        error={!!nameError}
                        helperText={nameError || ""}
                        inputProps={{maxLength: 255}}
                    />
                    <StyledTextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={3}
                        value={form.description || ""}
                        onChange={(e) => setForm({...form, description: e.target.value})}
                        variant="outlined"
                        error={!!descriptionError}
                        helperText={descriptionError || `${form.description?.length || 0}/1000`}
                        inputProps={{maxLength: 1000}}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{padding: 2}}>
                <Button onClick={onClose} variant="outlined" color="secondary">
                    Cancel
                </Button>
                <Button
                    onClick={onSubmit}
                    variant="contained"
                    color="primary"
                    disabled={!isFormValid}
                >
                    {editMode ? "Update" : "Create"}
                </Button>
            </DialogActions>
        </StyledDialog>
    );
};

export default CategoryFormDialog;