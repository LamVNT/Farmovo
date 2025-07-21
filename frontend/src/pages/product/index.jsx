import { useState, useEffect, useMemo } from 'react';
import { TextField, Button } from '@mui/material';
import { FaPlus } from 'react-icons/fa6';
import ProductTable from '../../components/product/ProductTable';
import ProductFormDialog from '../../components/product/ProductFormDialog';
import { productService } from '../../services/productService';
import { toast } from 'react-hot-toast';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const Product = () => {
    const [products, setProducts] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        id: null,
        productName: '',
        productDescription: '',
        productQuantity: 0,
        categoryId: null,
        storeId: 1,
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await productService.getAllProducts();
                console.log('Product page - fetched data:', data);
                if (data && data.length > 0) {
                    console.log('First product sample:', data[0]);
                    console.log('Products with timestamps:', data.map(p => ({
                        id: p.id,
                        name: p.productName,
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt
                    })));
                }
                setProducts(data);
            } catch (err) {
                console.error('Product page - error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
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
            productName: '',
            productDescription: '',
            productQuantity: 0, // Mặc định 0 khi tạo mới
            categoryId: null,
            storeId: 1,
        });
        setEditMode(false);
        setOpenDialog(true);
    };

    const handleOpenEdit = (product) => {
        setForm({
            id: product.id,
            productName: product.productName || '',
            productDescription: product.productDescription || '',
            productQuantity: product.productQuantity || 0,
            categoryId: product.categoryId || null,
            storeId: product.storeId || 1,
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
            const data = await productService.getAllProducts();
            setProducts(data);
        } catch (error) {
            setError(error.message);
            toast.error('Thao tác thất bại!');
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h2>
                        <p className="text-gray-600 mt-1">Quản lý danh sách sản phẩm trong hệ thống</p>
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
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
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
