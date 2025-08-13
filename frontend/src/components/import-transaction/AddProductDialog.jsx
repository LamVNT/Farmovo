import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Tabs,
    Tab,
    TextField,
    Select,
    MenuItem,
    Button,
    IconButton,
    InputAdornment,
    Snackbar,
    Alert
} from '@mui/material';
import { AiOutlinePlus } from 'react-icons/ai';
import { FiX } from 'react-icons/fi';
import axios from 'axios';
import DialogActions from '@mui/material/DialogActions';
import { productService } from '../../services/productService.js';

const AddProductDialog = ({ open, onClose, onProductCreated, onProductAdded, currentUser }) => {
    const [tab, setTab] = useState(0);
    const [product, setProduct] = useState({
        name: '',
        category: '',
        store: '', // Đổi từ location thành store
        description: '',
    });
    const [categories, setCategories] = useState([]);
    const [stores, setStores] = useState([]); // Đổi từ locations thành stores
    const [addCategoryOpen, setAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addStoreOpen, setAddStoreOpen] = useState(false); // Đổi từ addZoneOpen thành addStoreOpen
    const [newStoreName, setNewStoreName] = useState(''); // Đổi từ newZoneName thành newStoreName
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    const [newStoreDescription, setNewStoreDescription] = useState(''); // Đổi từ newZoneDescription thành newStoreDescription
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' // 'success', 'error', 'warning', 'info'
    });

    useEffect(() => {
        if (open) {
            // Fetch categories
            axios.get(`${import.meta.env.VITE_API_URL}/categories`, { withCredentials: true })
                .then(res => setCategories(res.data))
                .catch(() => setCategories([]));
            // Fetch stores - Admin/Manager có thể xem tất cả, Staff chỉ xem store của mình
            const isAdmin = currentUser?.roles?.includes('ADMIN') || currentUser?.roles?.includes('ROLE_ADMIN');
            const isManager = currentUser?.roles?.includes('MANAGER') || currentUser?.roles?.includes('ROLE_MANAGER');
            
            if (isAdmin || isManager) {
                // Admin/Manager xem tất cả stores
                axios.get(`${import.meta.env.VITE_API_URL}/admin/storeList`, { withCredentials: true })
                    .then(res => {
                        setStores(res.data);
                    })
                    .catch(() => setStores([]));
            } else {
                // Staff chỉ cần store của mình (nếu có)
                if (currentUser?.storeId) {
                    axios.get(`${import.meta.env.VITE_API_URL}/admin/storeList`, { withCredentials: true })
                        .then(res => {
                            // Filter chỉ store của staff này
                            const userStore = res.data.find(store => store.id === currentUser.storeId);
                            setStores(userStore ? [userStore] : []);
                        })
                        .catch(() => setStores([]));
                } else {
                    setStores([]);
                }
            }
        }
    }, [open, currentUser]);

    // useEffect riêng để set store mặc định cho staff
    useEffect(() => {
        console.log('AddProductDialog - currentUser:', currentUser);
        console.log('AddProductDialog - open:', open);
        console.log('AddProductDialog - roles:', currentUser?.roles);
        console.log('AddProductDialog - storeId:', currentUser?.storeId);
        
        // Chỉ kiểm tra role STAFF, không kiểm tra storeId cho ADMIN/MANAGER
        const isStaff = currentUser?.roles?.includes('STAFF') || currentUser?.roles?.includes('ROLE_STAFF');
        console.log('AddProductDialog - isStaff:', isStaff);
        
        if (open && isStaff && currentUser?.storeId) {
            console.log('AddProductDialog - Setting store for staff:', currentUser.storeId);
            setProduct(prev => ({
                ...prev,
                store: currentUser.storeId
            }));
        }
    }, [open, currentUser]);

    // useEffect riêng để set store khi currentUser thay đổi (chỉ cho STAFF)
    useEffect(() => {
        const isStaff = currentUser?.roles?.includes('STAFF') || currentUser?.roles?.includes('ROLE_STAFF');
        if (isStaff && currentUser?.storeId) {
            console.log('AddProductDialog - currentUser changed, setting store:', currentUser.storeId);
            setProduct(prev => ({
                ...prev,
                store: currentUser.storeId
            }));
        }
    }, [currentUser?.storeId, currentUser?.roles]);

    // useEffect để set store khi stores được load (chỉ cho STAFF)
    useEffect(() => {
        const isStaff = currentUser?.roles?.includes('STAFF') || currentUser?.roles?.includes('ROLE_STAFF');
        if (stores.length > 0 && isStaff && currentUser?.storeId && open) {
            console.log('AddProductDialog - stores loaded, setting store:', currentUser.storeId);
            setProduct(prev => ({
                ...prev,
                store: currentUser.storeId
            }));
        }
    }, [stores, currentUser?.storeId, currentUser?.roles, open]);

    // Reset form khi mở dialog
    useEffect(() => {
        if (open) {
            const isStaff = currentUser?.roles?.includes('STAFF') || currentUser?.roles?.includes('ROLE_STAFF');
            setProduct({
                name: '',
                category: '',
                store: isStaff && currentUser?.storeId ? currentUser.storeId : '',
                description: '',
            });
            setTab(0);
        }
    }, [open, currentUser]);

    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setProduct({ ...product, [field]: value });
    };

    const handleSubmit = async () => {
        // Validation
        if (!product.name.trim()) {
            alert('Vui lòng nhập tên sản phẩm');
            return;
        }
        if (!product.category) {
            alert('Vui lòng chọn nhóm hàng');
            return;
        }
        if (!product.store) {
            const isStaff = currentUser?.roles?.includes('STAFF') || currentUser?.roles?.includes('ROLE_STAFF');
            if (isStaff) {
                alert('Không thể xác định cửa hàng của bạn. Vui lòng liên hệ quản trị viên.');
            } else {
                alert('Vui lòng chọn cửa hàng');
            }
            return;
        }

        try {
            const payload = {
                productName: product.name,
                productDescription: product.description,
                categoryId: product.category,
                storeId: product.store,
                productQuantity: 0,
            };
            const createdProduct = await productService.createProduct(payload);
            resetForm();
            onClose();
            // Gọi callback để refresh danh sách products
            if (onProductCreated) {
                onProductCreated();
            }
            // Thêm product mới vào bảng
            if (onProductAdded && createdProduct) {
                onProductAdded(createdProduct);
            }
            // Thông báo thành công
            showNotification('Tạo sản phẩm mới thành công!', 'success');
        } catch (e) {
            showNotification('Không thể tạo sản phẩm mới!', 'error');
        }
    };

    const resetForm = () => {
        const isStaff = currentUser?.roles?.includes('STAFF') || currentUser?.roles?.includes('ROLE_STAFF');
        setProduct({
            name: '',
            category: '',
            store: isStaff && currentUser?.storeId ? currentUser.storeId : '',
            description: '',
        });
        setTab(0);
    };

    const showNotification = (message, severity = 'success') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/categories`, { name: newCategoryName, description: newCategoryDescription }, { withCredentials: true });
            setCategories(prev => [...prev, res.data]);
            setProduct(prev => ({ ...prev, category: res.data.id }));
            setAddCategoryOpen(false);
            setNewCategoryName('');
            setNewCategoryDescription('');
            showNotification('Thêm nhóm hàng mới thành công!', 'success');
        } catch (e) {
            showNotification('Không thể thêm nhóm hàng mới', 'error');
        }
    };
    const handleAddStore = async () => {
        if (!newStoreName.trim()) return;
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/store`, { 
                name: newStoreName, 
                description: newStoreDescription 
            }, { withCredentials: true });
            setStores(prev => [...prev, res.data]);
            setProduct(prev => ({ ...prev, store: res.data.id }));
            setAddStoreOpen(false);
            setNewStoreName('');
            setNewStoreDescription('');
            showNotification('Thêm cửa hàng mới thành công!', 'success');
        } catch (e) {
            showNotification('Không thể thêm cửa hàng mới', 'error');
        }
    };

    return (
        <>
            <Dialog open={open} onClose={() => { resetForm(); onClose(); }} maxWidth="md" fullWidth>
            <DialogTitle className="flex justify-between items-center p-4 pb-0">
                <span className="text-lg font-semibold">Thêm hàng hóa</span>
                <IconButton onClick={onClose}>
                    <FiX />
                </IconButton>
            </DialogTitle>

            <DialogContent className="p-4 pt-2">
                <Tabs value={tab} onChange={(e, newTab) => setTab(newTab)} indicatorColor="success">
                    <Tab label="Thông tin" />
                    <Tab label="Mô tả chi tiết" />
                </Tabs>

                {tab === 0 && (
                    <div className="mt-4 space-y-4 text-sm">
                        {/* Tên hàng (70%) */}
                        <div style={{ width: '70%' }}>
                            <TextField
                                label="Tên hàng"
                                variant="standard"
                                value={product.name}
                                onChange={handleChange('name')}
                                fullWidth
                            />
                        </div>

                            {/* Mô tả */}
                            <div>
                                <TextField
                                    label="Mô tả"
                                    variant="standard"
                                    value={product.description || ''}
                                    onChange={handleChange('description')}
                                    fullWidth
                                    multiline
                                    rows={3}
                                />
                            </div>

                            {/* Nhóm hàng + Cửa hàng */}
                        <div className="flex gap-4">
                            <div className="flex items-end gap-2 w-1/2">
                                <Select
                                    value={product.category}
                                    onChange={handleChange('category')}
                                    displayEmpty
                                    variant="standard"
                                    fullWidth
                                >
                                    <MenuItem value="">Danh mục</MenuItem>
                                        {categories.map((cat) => (
                                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                        ))}
                                </Select>
                                    <IconButton size="small" onClick={() => setAddCategoryOpen(true)}>
                                    <AiOutlinePlus />
                                </IconButton>
                            </div>

                            <div className="flex items-end gap-2 w-1/2">
                                <Select
                                    value={product.store}
                                    onChange={handleChange('store')}
                                    displayEmpty
                                    variant="standard"
                                    fullWidth
                                    disabled={currentUser?.roles?.includes('STAFF') || currentUser?.roles?.includes('ROLE_STAFF')}
                                >
                                    <MenuItem value="">---Cửa hàng---</MenuItem>
                                    {stores.map((store) => (
                                        <MenuItem key={store.id} value={store.id}>{store.name || store.storeName}</MenuItem>
                                    ))}
                                </Select>
                                {!(currentUser?.roles?.includes('STAFF') || currentUser?.roles?.includes('ROLE_STAFF')) && (
                                    <IconButton size="small" onClick={() => setAddStoreOpen(true)}>
                                        <AiOutlinePlus />
                                    </IconButton>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {tab === 1 && (
                    <div className="mt-4 text-gray-500 italic text-sm">
                        Mô tả chi tiết (chưa triển khai).
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-6">
                    <Button 
                        onClick={onClose} 
                        variant="outlined" 
                        color="inherit"
                        sx={{
                            borderColor: '#ddd',
                            color: '#666',
                            '&:hover': {
                                borderColor: '#999',
                                backgroundColor: '#f5f5f5'
                            }
                        }}
                    >
                        Bỏ qua
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                            boxShadow: '0 3px 15px rgba(76, 175, 80, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                                boxShadow: '0 5px 20px rgba(76, 175, 80, 0.4)',
                                transform: 'translateY(-1px)'
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Lưu
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

            {/* Dialog thêm category */}
            <Dialog open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)}>
                <DialogTitle>Thêm nhóm hàng mới</DialogTitle>
                <DialogContent>
                    <TextField label="Tên nhóm hàng" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} fullWidth autoFocus />
                    <TextField label="Mô tả" value={newCategoryDescription} onChange={e => setNewCategoryDescription(e.target.value)} fullWidth multiline rows={2} sx={{ mt: 2 }} />
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setAddCategoryOpen(false)}
                        sx={{
                            color: '#666',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={handleAddCategory} 
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                            boxShadow: '0 3px 15px rgba(76, 175, 80, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                                boxShadow: '0 5px 20px rgba(76, 175, 80, 0.4)',
                                transform: 'translateY(-1px)'
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Thêm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog thêm store */}
            <Dialog open={addStoreOpen} onClose={() => setAddStoreOpen(false)}>
                <DialogTitle>Thêm cửa hàng mới</DialogTitle>
                <DialogContent>
                    <TextField label="Tên cửa hàng" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} fullWidth autoFocus />
                    <TextField label="Mô tả" value={newStoreDescription} onChange={e => setNewStoreDescription(e.target.value)} fullWidth multiline rows={2} sx={{ mt: 2 }} />
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setAddStoreOpen(false)}
                        sx={{
                            color: '#666',
                            '&:hover': { backgroundColor: '#f5f5f5' }
                        }}
                    >
                        Hủy
                    </Button>
                    <Button 
                        onClick={handleAddStore} 
                        variant="contained"
                        sx={{
                            background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                            boxShadow: '0 3px 15px rgba(76, 175, 80, 0.3)',
                            '&:hover': {
                                background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                                boxShadow: '0 5px 20px rgba(76, 175, 80, 0.4)',
                                transform: 'translateY(-1px)'
                            },
                            fontWeight: 600,
                            borderRadius: 2,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Thêm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar thông báo */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default AddProductDialog;
