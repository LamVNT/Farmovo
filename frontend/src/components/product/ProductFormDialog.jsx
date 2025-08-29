import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Autocomplete
} from '@mui/material';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { userService } from '../../services/userService';

const ProductFormDialog = ({ open, onClose, onSubmit, form, setForm, editMode, existingProducts = [] }) => {
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isStaff, setIsStaff] = useState(false);
    const [nameError, setNameError] = useState('');

    // Validation function để kiểm tra trùng lặp tên sản phẩm
    const validateProductName = (name) => {
        if (!name || name.trim() === '') {
            setNameError('');
            return true;
        }
        
        const trimmedName = name.trim();
        const isOwner = currentUser?.roles?.includes('OWNER') || currentUser?.roles?.includes('ROLE_OWNER');
        
        const isDuplicate = existingProducts.some(product => {
            if (isOwner) {
                // Owner: Chỉ kiểm tra trùng lặp trong cùng store
                const sameStore = product.storeId === form.storeId;
                const sameName = product.productName?.trim().toLowerCase() === trimmedName.toLowerCase();
                const isCurrentProduct = editMode && product.id === form.id;
                
                return sameStore && sameName && !isCurrentProduct;
            } else {
                // Staff: Kiểm tra trùng lặp trong cùng store và category
                const sameStore = product.storeId === form.storeId;
                const sameCategory = product.categoryId === form.categoryId;
                const sameName = product.productName?.trim().toLowerCase() === trimmedName.toLowerCase();
                const isCurrentProduct = editMode && product.id === form.id;
                
                return sameStore && sameCategory && sameName && !isCurrentProduct;
            }
        });
        
        if (isDuplicate) {
            if (isOwner) {
                setNameError('Sản phẩm này đã tồn tại trong cửa hàng');
            } else {
                setNameError('Sản phẩm này đã tồn tại trong danh mục và cửa hàng');
            }
            return false;
        } else {
            setNameError('');
            return true;
        }
    };

    // Xử lý thay đổi tên sản phẩm
    const handleNameChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        
        // Validate tên sản phẩm khi thay đổi
        if (name === 'productName') {
            validateProductName(value);
        }
    };

    // Xử lý thay đổi store hoặc category để re-validate tên sản phẩm
    const handleStoreOrCategoryChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        
        // Re-validate tên sản phẩm khi store hoặc category thay đổi
        if (form.productName) {
            validateProductName(form.productName);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching current user and categories...');
                const [userRes, catRes] = await Promise.all([
                    userService.getCurrentUser(),
                    axios.get(`${import.meta.env.VITE_API_URL}/categories`, { withCredentials: true })
                ]);

                console.log('Current user:', userRes);
                console.log('Categories response:', catRes.data);

                setCategories(catRes.data);
                setCurrentUser(userRes);

                const roles = userRes?.roles || [];
                // Kiểm tra cả 2 biến thể ROLE_STAFF và STAFF
                const hasStaffRole = roles.includes('ROLE_STAFF') || roles.includes('STAFF');
                setIsStaff(hasStaffRole);

                if (hasStaffRole) {
                    // Với STAFF: không gọi API /admin/storeList (tránh 401), dùng store từ user
                    if (userRes?.storeId && userRes?.storeName) {
                        const staffStore = [{ id: userRes.storeId, name: userRes.storeName }];
                        setStores(staffStore);
                        if (!editMode) {
                            setForm(prev => ({ ...prev, storeId: userRes.storeId }));
                        }
                    } else {
                        console.warn('Staff user does not have storeId/storeName');
                        setStores([]);
                    }
                } else {
                    // Với ADMIN/OWNER: lấy danh sách tất cả cửa hàng
                    const storeRes = await axios.get(`${import.meta.env.VITE_API_URL}/admin/storeList`, { withCredentials: true });
                    console.log('Stores response:', storeRes.data);
                    setStores(storeRes.data.map(s => ({ id: s.id, name: s.storeName })));
                }
            } catch (e) {
                console.error('Lỗi tải dữ liệu:', e);
                console.error('Error details:', e.response?.data || e.message);
            }
        };

        if (open) fetchData();
    }, [open, editMode, setForm]);

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
                        onChange={handleNameChange} 
                        required
                        error={!!nameError}
                        helperText={nameError}
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
                        onChange={(e, val) => handleStoreOrCategoryChange('categoryId', val?.id || null)}
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
                        onChange={(e, val) => handleStoreOrCategoryChange('storeId', val?.id || null)}
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
                        
                        // Kiểm tra validation trước khi submit
                        if (form.productName && !validateProductName(form.productName)) {
                            return; // Không submit nếu có lỗi validation
                        }
                        
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
