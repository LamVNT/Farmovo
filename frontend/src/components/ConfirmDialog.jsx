import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const ConfirmDialog = ({ open, onClose, onConfirm, title, content, confirmText = 'OK', cancelText = 'Cancel' }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" variant="outlined">{cancelText}</Button>
        <Button onClick={onConfirm} color="primary" variant="contained">{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog; 