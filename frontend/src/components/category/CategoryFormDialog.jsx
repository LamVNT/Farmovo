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
        if (!form.name.trim()) return "Tên danh mục không được để trống";
        if (form.name.length > 255) return "Tên danh mục không vượt quá 255 ký tự";
        return null;
    };

    const validateDescription = () => {
        if (form.description && form.description.length > 1000) {
            return "Mô tả không vượt quá 1000 ký tự";
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
                    {editMode ? "Chỉnh sửa danh mục" : "Tạo mới danh mục"}
                </span>
            </DialogTitle>
            <DialogContent>
                <Box sx={{padding: 2}}>
                    <StyledTextField
                        autoFocus
                        margin="dense"
                        label="Tên danh mục"
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
                        label="Mô tả"
                        fullWidth
                        multiline
                        rows={3}
                        value={form.description || ""}
                        onChange={(e) => setForm({...form, description: e.target.value})}
                        variant="outlined"
                        error={!!descriptionError}
                        helperText={descriptionError || `${form.description?.length || 0}/1000 ký tự`}
                        inputProps={{maxLength: 1000}}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{padding: 2}}>
                <Button onClick={onClose} variant="outlined" color="secondary">
                    Hủy
                </Button>
                <Button
                    onClick={onSubmit}
                    variant="contained"
                    color="primary"
                    disabled={!isFormValid}
                >
                    {editMode ? "Cập nhật" : "Tạo mới"}
                </Button>
            </DialogActions>
        </StyledDialog>
    );
};

export default CategoryFormDialog;