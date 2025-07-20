import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Autocomplete
} from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';

const ProductFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, storeRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/categories`, { withCredentials: true }),
                    axios.get(`${import.meta.env.VITE_API_URL}/admin/storeList`, {
                        withCredentials: true,
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }),
                ]);
                setCategories(catRes.data);
                setStores(storeRes.data.map(s => ({ id: s.id, name: s.name })));
            } catch (e) {
                console.error('Lỗi tải dữ liệu:', e);
            }
        };

        if (open) fetchData();
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ 
                fontWeight: 700, 
                fontSize: 22, 
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e9ecef'
            }}>
                {editMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </DialogTitle>
            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {editMode && (
                        <TextField 
                            label="ID" 
                            fullWidth 
                            disabled 
                            value={form.id || 'N/A'}
                            sx={{
                                '& .MuiInputBase-root': {
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: 2
                                }
                            }}
                        />
                    )}
                    <TextField 
                        label="Tên sản phẩm" 
                        name="productName" 
                        fullWidth
                        value={form.productName || ''} 
                        onChange={handleChange} 
                        required
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                    borderColor: '#1976d2',
                                },
                            }
                        }}
                    />
                    <TextField 
                        label="Mô tả sản phẩm" 
                        name="productDescription" 
                        fullWidth
                        value={form.productDescription || ''} 
                        onChange={handleChange} 
                        multiline
                        rows={3}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                '&:hover fieldset': {
                                    borderColor: '#1976d2',
                                },
                            }
                        }}
                    />
                    <Autocomplete
                        options={categories}
                        getOptionLabel={(opt) => opt.name}
                        value={categories.find(c => c.id === form.categoryId) || null}
                        onChange={(e, val) => setForm(prev => ({ ...prev, categoryId: val?.id || null }))}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Danh mục" 
                                fullWidth
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: '#1976d2',
                                        },
                                    }
                                }}
                            />
                        )}
                    />
                    <Autocomplete
                        options={stores}
                        getOptionLabel={(opt) => opt.name}
                        value={stores.find(s => s.id === form.storeId) || null}
                        onChange={(e, val) => setForm(prev => ({ ...prev, storeId: val?.id || null }))}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label="Cửa hàng" 
                                fullWidth
                                required
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: '#1976d2',
                                        },
                                    }
                                }}
                            />
                        )}
                    />
                </div>
            </DialogContent>
            <DialogActions sx={{ 
                justifyContent: 'center', 
                pb: 3, 
                px: 3,
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e9ecef'
            }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined" 
                    color="primary"
                    sx={{ 
                        borderRadius: 2, 
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    Hủy
                </Button>
                <Button 
                    variant="contained" 
                    onClick={onSubmit}
                    sx={{ 
                        borderRadius: 2, 
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {editMode ? 'Cập nhật' : 'Thêm mới'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductFormDialog;
