import {useState, useEffect, useMemo} from 'react';
import {TextField, Button} from '@mui/material';
import {FaPlus} from 'react-icons/fa6';
import ProductTable from '../../components/product/ProductTable';
import ProductFormDialog from '../../components/product/ProductFormDialog';
import {productService} from '../../services/productService';

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

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const data = await productService.getAllProducts();
                setProducts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        return Array.isArray(products)
            ? products.filter(p =>
                (p.productName || '').toLowerCase().includes(searchText.toLowerCase())
            )
            : [];
    }, [searchText, products]);

    const handleOpenCreate = () => {
        setForm({
            id: null,
            productName: '',
            productDescription: '',
            productQuantity: 0,
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
        setForm((prev) => ({...prev}));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            try {
                await productService.deleteProduct(id);
                setProducts((prev) => prev.filter((p) => p.id !== id));
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleSubmit = async () => {
        try {
            if (editMode) {
                await productService.updateProduct(form.id, form);
            } else {
                await productService.createProduct(form);
            }
            handleClose();
            const data = await productService.getAllProducts();
            setProducts(data);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="p-5 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Quản lý sản phẩm</h2>
                <div className="flex gap-3">
                    <TextField
                        size="small"
                        label="Tìm kiếm"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleOpenCreate} startIcon={<FaPlus/>}>
                        Thêm
                    </Button>
                </div>
            </div>

            {error && <p style={{color: 'red'}}>{error}</p>}
            {loading ? (
                <p>Đang tải...</p>
            ) : (
                <ProductTable
                    products={filteredProducts}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                />
            )}

            <ProductFormDialog
                open={openDialog}
                onClose={handleClose}
                onSubmit={handleSubmit}
                form={form}
                setForm={setForm}
                editMode={editMode}
            />
        </div>
    );
};

export default Product;
