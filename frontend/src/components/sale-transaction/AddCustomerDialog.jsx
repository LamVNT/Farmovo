import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { customerService } from '../../services/customerService';

const AddCustomerDialog = ({ open, onClose, onCustomerAdded, currentUser }) => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        role: 'CUSTOMER',
        totalDept: 0,
        isSupplier: false
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            alert('Vui lòng nhập tên khách hàng');
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                name: form.name,
                email: form.email,
                phone: form.phone,
                address: form.address,
                role: form.role,
                totalDept: form.totalDept,
                isSupplier: form.isSupplier
            };

            const createdBy = currentUser?.id || 1;
            const newCustomer = await customerService.createCustomer(requestData, createdBy);
            
            onCustomerAdded(newCustomer);
            onClose();
            
            // Reset form
            setForm({
                name: '',
                email: '',
                phone: '',
                address: '',
                role: 'CUSTOMER',
                totalDept: 0,
                isSupplier: false
            });
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Có lỗi xảy ra khi tạo khách hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset form
        setForm({
            name: '',
            email: '',
            phone: '',
            address: '',
            role: 'CUSTOMER',
            totalDept: 0,
            isSupplier: false
        });
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    minHeight: '400px'
                }
            }}
        >
            <DialogTitle sx={{ 
                pb: 1, 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid #e0e0e0'
            }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                    Thêm khách hàng mới
                </Typography>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Tên khách hàng */}
                    <TextField
                        name="name"
                        label="Tên khách hàng"
                        value={form.name}
                        onChange={handleChange}
                        variant="standard"
                        fullWidth
                        required
                        sx={{
                            '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                            '& .MuiInput-underline:hover:before': { borderBottomColor: '#1976d2' },
                            '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' }
                        }}
                    />

                    {/* Email và Số điện thoại */}
                    <Box sx={{ display: 'flex', gap: 4 }}>
                        <TextField
                            name="email"
                            label="Email"
                            value={form.email}
                            onChange={handleChange}
                            variant="standard"
                            sx={{ 
                                flex: 1,
                                '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                                '& .MuiInput-underline:hover:before': { borderBottomColor: '#1976d2' },
                                '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' }
                            }}
                        />
                        <TextField
                            name="phone"
                            label="Số điện thoại"
                            value={form.phone}
                            onChange={handleChange}
                            variant="standard"
                            sx={{ 
                                flex: 1,
                                '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                                '& .MuiInput-underline:hover:before': { borderBottomColor: '#1976d2' },
                                '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' }
                            }}
                        />
                    </Box>

                    {/* Địa chỉ */}
                    <TextField
                        name="address"
                        label="Địa chỉ"
                        value={form.address}
                        onChange={handleChange}
                        variant="standard"
                        fullWidth
                        multiline
                        rows={2}
                        sx={{
                            '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                            '& .MuiInput-underline:hover:before': { borderBottomColor: '#1976d2' },
                            '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' }
                        }}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                <Button 
                    onClick={handleClose}
                    sx={{ 
                        color: '#666',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                    }}
                >
                    Hủy
                </Button>
                <Button 
                    onClick={handleSubmit}
                    disabled={loading || !form.name.trim()}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        },
                        '&:disabled': {
                            background: '#ccc',
                            color: '#666'
                        }
                    }}
                >
                    {loading ? 'Đang tạo...' : 'Thêm khách hàng'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCustomerDialog; 