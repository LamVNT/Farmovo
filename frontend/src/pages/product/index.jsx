import { useState, useEffect, useMemo } from 'react';
import { TextField, Button } from '@mui/material';
import { FaPlus } from 'react-icons/fa6';
import ProductTable from '../../components/product/ProductTable';
import ProductFormDialog from '../../components/product/ProductFormDialog';
import { productService } from '../../services/productService';
import { userService } from '../../services/userService';
import { toast } from 'react-hot-toast';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const Product = () => {
    const [products, setProducts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        id: null,
        productCode: '',
        productName: '',
        productDescription: '',
        productQuantity: 0,
        categoryId: null,
        storeId: null,
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isStaff, setIsStaff] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Lấy thông tin user hiện tại
                const userData = await userService.getCurrentUser();
                setCurrentUser(userData);
                
                // Kiểm tra role staff
                const hasStaffRole = userData.roles && userData.roles.includes('ROLE_STAFF');
                setIsStaff(hasStaffRole);
                
                // Lấy tất cả sản phẩm
                const data = await productService.getAllProducts();
                console.log('Product page - fetched data:', data);
                
                // Nếu là staff, chỉ hiển thị sản phẩm của store của họ
                let filteredData = data;
                if (hasStaffRole && userData.storeId) {
                    filteredData = data.filter(product => product.storeId === userData.storeId);
                    console.log('Staff - filtered products for store:', userData.storeId, filteredData.length);
                }
                
                if (filteredData && filteredData.length > 0) {
                    console.log('First product sample:', filteredData[0]);
                    console.log('Products with timestamps:', filteredData.map(p => ({
                        id: p.id,
                        name: p.productName,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt
                    })));
                }
                setProducts(filteredData);
            } catch (err) {
                console.error('Product page - error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredProducts = useMemo(() => {
        if (!Array.isArray(products)) return [];
        
        // Lọc theo search text
        const filtered = products.filter(p =>
                (p.productName || '').toLowerCase().includes(searchText.toLowerCase())
        );
        
        // Sắp xếp theo thứ tự: mới cập nhật nhất trước, sau đó mới tạo nhất
        const sorted = filtered.sort((a, b) => {
            // Ưu tiên theo updatedAt trước
            if (a.updatedAt && b.updatedAt) {
                const updatedDiff = new Date(b.updatedAt) - new Date(a.updatedAt);
                if (updatedDiff !== 0) return updatedDiff;
            }
            
            // Nếu updatedAt bằng nhau hoặc không có, sắp xếp theo createdAt
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            
            // Fallback: sắp xếp theo ID (mới nhất trước)
            return b.id - a.id;
        });
        
        // Debug: kiểm tra thứ tự sau khi sắp xếp
        console.log('Sorted products order:', sorted.map(p => ({
            id: p.id,
            name: p.productName,
            updatedAt: p.updatedAt,
            createdAt: p.createdAt
        })));
        
        return sorted;
    }, [searchText, products]);

    const handleOpenCreate = () => {
        setForm({
            id: null,
            productCode: '',
            productName: '',
            productDescription: '',
            productQuantity: 0, // Mặc định 0 khi tạo mới
            categoryId: null,
            storeId: null,
        });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (product) => {
        setForm({
            id: product.id,
            productCode: product.productCode || '',
            productName: product.productName || '',
            productDescription: product.productDescription || '',
            productQuantity: product.productQuantity || 0,
            categoryId: product.categoryId || null,
            storeId: product.storeId || null,
        });
        setEditMode(true);
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
        setForm((prev) => ({ ...prev }));
    };

    const handleDeleteRequest = (product) => {
        setProductToDelete(product);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!productToDelete) return;
        
        // Kiểm tra quyền xóa cho staff
        if (isStaff && currentUser?.storeId && productToDelete.storeId !== currentUser.storeId) {
            toast.error('Bạn không có quyền xóa sản phẩm này!');
            setConfirmOpen(false);
            setProductToDelete(null);
            return;
        }
        
        try {
            await productService.deleteProduct(productToDelete.id);
            setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
            toast.success('Xóa sản phẩm thành công!');
        } catch (err) {
            setError(err.message);
            toast.error('Xóa sản phẩm thất bại!');
        } finally {
            setConfirmOpen(false);
            setProductToDelete(null);
        }
    };

    const handleSubmit = async () => {
        try {
            // Validate required fields
            if (!form.productName || form.productName.trim() === '') {
                toast.error('Tên sản phẩm không được để trống!');
                return;
            }
            if (!form.categoryId) {
                toast.error('Vui lòng chọn danh mục!');
                return;
            }
            if (!form.storeId) {
                toast.error('Vui lòng chọn cửa hàng!');
                return;
            }

            // Đảm bảo productQuantity = 0 khi tạo mới
            const submitData = {
                ...form,
                productQuantity: form.productQuantity || 0
            };
            
            if (editMode) {
                await productService.updateProduct(form.id, submitData);
                toast.success('Cập nhật sản phẩm thành công!');
            } else {
                await productService.createProduct(submitData);
                toast.success('Thêm sản phẩm mới thành công!');
            }
            handleClose();
            // Refresh data với filter cho staff
            const data = await productService.getAllProducts();
            let filteredData = data;
            if (isStaff && currentUser?.storeId) {
                filteredData = data.filter(product => product.storeId === currentUser.storeId);
            }
            setProducts(filteredData);
        } catch (error) {
            console.error('Submit error:', error);
            setError(error.message);
            toast.error(`Thao tác thất bại: ${error.message}`);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h2>
                        <p className="text-gray-600 mt-1">
                            {isStaff 
                                ? `Quản lý danh sách sản phẩm của cửa hàng: ${currentUser?.storeName || 'N/A'}`
                                : 'Quản lý danh sách sản phẩm trong hệ thống'
                            }
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <TextField
                            size="small"
                            label="Tìm kiếm sản phẩm"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            sx={{
                                minWidth: 300,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: '#fff',
                                }
                            }}
                        />
                        <Button 
                            variant="contained" 
                            onClick={handleOpenCreate} 
                            startIcon={<FaPlus />}
                            sx={{
                                borderRadius: 2,
                                px: 3,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                                '&:hover': {
                                    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                                }
                            }}
                        >
                            Thêm mới
                        </Button>
                    </div>
                </div>
                
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-400 hover:text-red-600"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                
                {isStaff && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>Thông báo:</strong> Bạn chỉ có thể xem và quản lý sản phẩm của cửa hàng <strong>{currentUser?.storeName || 'N/A'}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200">
                        <ProductTable
                            products={filteredProducts}
                            onEdit={handleOpenEdit}
                            onDelete={id => handleDeleteRequest(products.find(p => p.id === id))}
                        />
                    </div>
                )}
            </div>
            
            <ProductFormDialog
                open={openDialog}
                onClose={handleClose}
                onSubmit={handleSubmit}
                form={form}
                setForm={setForm}
                editMode={editMode}
            />
            
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <DialogTitle fontWeight={700} fontSize={22} textAlign="center">Xác nhận xóa sản phẩm</DialogTitle>
                <DialogContent sx={{ textAlign: 'center', fontSize: 18, py: 2 }}>
                    Bạn có chắc chắn muốn xóa sản phẩm <b>{productToDelete?.productName}</b> không?<br/>
                    Hành động này không thể hoàn tác!
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button onClick={() => setConfirmOpen(false)} variant="outlined" color="primary">Hủy</Button>
                    <Button onClick={handleDelete} variant="contained" color="error">Xóa</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Product;
