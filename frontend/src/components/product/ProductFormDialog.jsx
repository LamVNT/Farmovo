import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Autocomplete
} from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { userService } from '../../services/userService';

const ProductFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode }) => {
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isStaff, setIsStaff] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching categories, stores, and current user...');
                const [catRes, storeRes, userRes] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/categories`, { withCredentials: true }),
                    axios.get(`${import.meta.env.VITE_API_URL}/admin/storeList`, {
                        withCredentials: true
                    }),
                    userService.getCurrentUser()
                ]);
                console.log('Categories response:', catRes.data);
                console.log('Stores response:', storeRes.data);
                console.log('Current user:', userRes);
                
                setCategories(catRes.data);
                setStores(storeRes.data.map(s => ({ id: s.id, name: s.storeName })));
                setCurrentUser(userRes);
                
                // Kiểm tra xem user có role staff không
                const hasStaffRole = userRes.roles && userRes.roles.includes('ROLE_STAFF');
                setIsStaff(hasStaffRole);
                
                // Nếu là staff và đang tạo mới, set store mặc định
                if (hasStaffRole && !editMode && userRes.storeId) {
                    setForm(prev => ({ ...prev, storeId: userRes.storeId }));
                }

                
                console.log('Processed stores:', storeRes.data.map(s => ({ id: s.id, name: s.storeName })));
                console.log('Is staff:', hasStaffRole);
            } catch (e) {
                console.error('Lỗi tải dữ liệu:', e);
                console.error('Error details:', e.response?.data);
            }
        };

        if (open) fetchData();
    }, [open, editMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log('Form field changed:', name, value);
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
                        <>
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
                            <TextField 
                                label="Mã sản phẩm" 
                                fullWidth 
                                disabled 
                                value={form.productCode || 'N/A'}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: 2
                                    }
                                }}
                            />
                        </>
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
                        onChange={(e, val) => {
                            console.log('Store selected:', val);
                            setForm(prev => ({ ...prev, storeId: val?.id || null }));
                        }}
                        disabled={isStaff}
                        renderInput={(params) => (
                            <TextField 
                                {...params} 
                                label={isStaff ? "Cửa hàng (Tự động)" : "Cửa hàng"}
                                fullWidth
                                required
                                disabled={isStaff}
                                placeholder={stores.length === 0 ? "Đang tải cửa hàng..." : (isStaff ? "Tự động chọn theo cửa hàng của bạn" : "Chọn cửa hàng")}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        backgroundColor: isStaff ? '#f5f5f5' : '#fff',
                                        '&:hover fieldset': {
                                            borderColor: isStaff ? '#ccc' : '#1976d2',
                                        },
                                        '&.Mui-disabled': {
                                            backgroundColor: '#f5f5f5',
                                            color: '#666'
                                        }
                                    }
                                }}
                            />
                        )}
                        noOptionsText="Không có cửa hàng nào"
                        loading={stores.length === 0}
                    />
                    {isStaff && (
                        <div style={{ 
                            fontSize: '0.75rem', 
                            color: '#666', 
                            fontStyle: 'italic',
                            marginTop: '-8px',
                            marginBottom: '8px'
                        }}>
                            * Cửa hàng được tự động chọn theo cửa hàng của bạn
                        </div>
                    )}

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
                    onClick={() => {
                        console.log('Form data before submit:', form);
                        console.log('Stores available:', stores);
                        onSubmit();
                    }}
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
